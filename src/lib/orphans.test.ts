import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { Game, Profile, SaveState, StoredPokemon, User } from '@/models';
import type { StoreListing } from './blob';
import { blobStore } from './saveFile';
import { GRACE_MS, classify, deleteOrphans, fileKey, findOrphans, referencedFiles } from './orphans';

const PRIVATE = 'https://abc123.private.blob.vercel-storage.com';
const PUBLIC = 'https://abc123.public.blob.vercel-storage.com';
const SLUG = 'ash_at_pallet-town';
const OLD = new Date(Date.now() - 2 * GRACE_MS);

let server: MongoMemoryServer;
let deleted: string[];

before(async () => {
    server = await MongoMemoryServer.create();
    await mongoose.connect(server.getUri());
});

after(async () => {
    await mongoose.disconnect();
    await server.stop();
});

beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    deleted = [];
    mock.method(blobStore, 'del', async (url: string) => { deleted.push(url); });
});

afterEach(() => mock.restoreAll());

const file = (base: string, pathname: string, uploadedAt = OLD, size = 100) => ({ url: `${base}/${pathname}`, pathname, size, uploadedAt });
const listing = (store: 'private' | 'public', files: ReturnType<typeof file>[], error?: string): StoreListing => ({ store, files, error });

async function setup() {
    const ash = await User.create({ email: 'ash@pallet.town', passwordHash: 'x', emailVerified: true });
    const game = await Game.create({
        userId: ash._id, title: 'Red',
        filePath: `${PRIVATE}/games/${SLUG}/red-1/pokered.gb`, img: `${PRIVATE}/games/${SLUG}/red-1/cover.jpg`,
    });
    await SaveState.create({
        userId: ash._id, gameId: game._id, title: 'Brock',
        filePath: `${PRIVATE}/saves/${SLUG}/red/brock-1/save-abc.sav`, img: `${PRIVATE}/saves/${SLUG}/red/brock-1/shot.png`,
    });
    await Profile.create({ userId: ash._id, username: 'ash', email: ash.email, avatar: `${PRIVATE}/avatars/${SLUG}/me.png` });
    await StoredPokemon.create({
        userId: ash._id, sourceGameId: game._id, generation: 1, sourceSlot: { location: 'party', slotIndex: 0 },
        speciesIndex: 84, speciesName: 'PIKACHU', otId: 1, level: 5, rawBoxData: Buffer.alloc(33), extractedAt: new Date(),
        status: 'transferring',
        transfer: {
            direction: 'to_save', saveStateId: new mongoose.Types.ObjectId(), startedAt: new Date(),
            fromFilePath: `${PRIVATE}/saves/${SLUG}/red/brock-1/save-abc.sav`, toFilePath: `${PRIVATE}/saves/${SLUG}/red/brock-1/save-new.sav`,
        },
    });
    return { ash, game };
}

const inUse = [
    file(PRIVATE, `games/${SLUG}/red-1/pokered.gb`),
    file(PRIVATE, `games/${SLUG}/red-1/cover.jpg`),
    file(PRIVATE, `saves/${SLUG}/red/brock-1/save-abc.sav`),
    file(PRIVATE, `saves/${SLUG}/red/brock-1/shot.png`),
    file(PRIVATE, `avatars/${SLUG}/me.png`),
    file(PRIVATE, `saves/${SLUG}/red/brock-1/save-new.sav`),
];

describe('fileKey', () => {
    it('matches the same file whatever its query string or encoding', () => {
        assert.equal(fileKey(`${PRIVATE}/games/a%20b/x.gb?v=3`), fileKey(`${PRIVATE}/games/a b/x.gb`));
        assert.notEqual(fileKey(`${PRIVATE}/games/x.gb`), fileKey(`${PUBLIC}/games/x.gb`));
        assert.equal(fileKey('not a url'), null);
    });
});

describe('referencedFiles', () => {
    it('collects ROMs, covers, saves, screenshots, avatars and both files of a move', async () => {
        await setup();
        const kinds = (await referencedFiles()).map((r) => r.kind).sort();
        assert.deepEqual(kinds, ['avatar', 'cover', 'rom', 'save', 'screenshot', 'transfer', 'transfer']);
    });
});

describe('classify and findOrphans', () => {
    it("finds only files nobody points to, and guesses whose folder they're in", async () => {
        const { ash } = await setup();
        const report = await findOrphans(async () => [listing('private', [
            ...inUse,
            file(PRIVATE, `saves/${SLUG}/red/brock-1/save-old.sav`, OLD, 500),
            // An older path, holding the user id deeper in
            file(PRIVATE, `games/legacy/${ash._id}/blue.gb`, OLD, 900),
            file(PRIVATE, 'avatars/someone-deleted/me.png'),
        ])]);

        assert.deepEqual(report.orphans.map((o) => o.pathname), [
            `games/legacy/${ash._id}/blue.gb`, `saves/${SLUG}/red/brock-1/save-old.sav`, 'avatars/someone-deleted/me.png',
        ]);
        assert.equal(report.orphans[0].ownerEmail, 'ash@pallet.town');
        assert.equal(report.orphans[1].ownerId, String(ash._id));
        assert.equal(report.orphans[2].ownerId, undefined);
        assert.deepEqual(report.missing, []);
    });

    it('leaves files inside the grace period alone, and counts them', async () => {
        await setup();
        const report = await findOrphans(async () => [listing('private', [
            ...inUse, file(PRIVATE, `games/${SLUG}/new-2/upload.gb`, new Date()),
        ])]);
        assert.deepEqual(report.orphans, []);
        assert.equal(report.recent, 1);
    });

    it('reports records whose file is gone, but only for stores it could list', () => {
        const refs = [
            { url: `${PRIVATE}/saves/x/gone.sav`, kind: 'save' as const, label: 'Gone', userId: 'u1' },
            { url: `${PUBLIC}/saves/x/also-gone.sav`, kind: 'save' as const, label: 'Unknown', userId: 'u1' },
            // A preset cover from the app's own assets isn't a user file
            { url: `${PRIVATE}/assets/app/cover.jpg`, kind: 'cover' as const, label: 'Preset', userId: 'u1' },
        ];
        const report = classify([listing('private', []), listing('public', [], 'Not configured here')], refs, new Map());
        assert.deepEqual(report.missing.map((m) => m.label), ['Gone']);
        assert.deepEqual(report.stores, [{ store: 'private', error: undefined, files: 0 }, { store: 'public', error: 'Not configured here', files: 0 }]);
    });
});

describe('deleteOrphans', () => {
    it('deletes what is still orphaned and skips the rest, whatever it was asked', async () => {
        await setup();
        const orphan = file(PRIVATE, `saves/${SLUG}/red/brock-1/save-old.sav`);
        const tooNew = file(PRIVATE, `games/${SLUG}/new-2/upload.gb`, new Date());
        const list = async () => [listing('private', [...inUse, orphan, tooNew])];

        const result = await deleteOrphans([
            `${orphan.url}?v=1`,
            inUse[0].url, // in use: must never go
            tooNew.url,
            `${PRIVATE}/games/never-existed.gb`,
        ], list);

        assert.deepEqual(deleted, [orphan.url]);
        assert.deepEqual(result.deleted, [{ url: orphan.url, size: 100 }]);
        assert.equal(result.skipped.length, 3);
    });

    it('keeps going past a file that fails to delete', async () => {
        await setup();
        const a = file(PRIVATE, `saves/${SLUG}/a.sav`), b = file(PRIVATE, `saves/${SLUG}/b.sav`);
        mock.method(blobStore, 'del', async (url: string) => {
            if (url === a.url) throw new Error('store said no');
            deleted.push(url);
        });
        const result = await deleteOrphans([a.url, b.url], async () => [listing('private', [...inUse, a, b])]);
        assert.deepEqual(deleted, [b.url]);
        assert.deepEqual(result.skipped, [{ url: a.url, reason: 'store said no' }]);
    });
});
