import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { Game, Notification, Profile, RanchPen, SaveState, StoredPokemon, User } from '@/models';
import { blobStore } from './saveFile';
import { deleteGame, deleteSave, deleteUser } from './userFiles';

const STORE = 'https://abc123.private.blob.vercel-storage.com';
const ASSET = 'https://abc123.public.blob.vercel-storage.com/assets/app/cover-art/red.jpg';
const SLUG = 'ash_at_pallet-town';

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

async function setup() {
    const ash = await User.create({ email: 'ash@pallet.town', passwordHash: 'x', emailVerified: true });
    const red = await Game.create({
        userId: ash._id, title: 'Red',
        filePath: `${STORE}/games/${SLUG}/red-1/pokered.gbc`,
        img: `${STORE}/games/${SLUG}/red-1/cover.jpg`,
    });
    const blue = await Game.create({ userId: ash._id, title: 'Blue', filePath: `${STORE}/games/${SLUG}/blue-2/pokeblue.gbc` });
    const save = (game: typeof red, name: string, img = true) => SaveState.create({
        userId: ash._id, gameId: game._id, title: name,
        filePath: `${STORE}/saves/${SLUG}/${game.title}/${name}/save-x.sav`,
        ...(img ? { img: `${STORE}/saves/${SLUG}/${game.title}/${name}/screenshot.png` } : {}),
    });
    const [redA, redB, blueA] = [await save(red, 'a'), await save(red, 'b', false), await save(blue, 'a')];
    return { ash, red, blue, redA, redB, blueA };
}

describe('deleteGame', () => {
    it('deletes the game, its saves, and all their files', async () => {
        const { red, redA, redB } = await setup();

        const result = await deleteGame(red);

        assert.equal(await Game.exists({ _id: red._id }), null);
        assert.equal(await SaveState.countDocuments({ gameId: red._id }), 0);
        assert.deepEqual(result, { saves: 2, files: 5 });
        assert.deepEqual(new Set(deleted), new Set([
            red.filePath, red.img, redA.filePath, redA.img, redB.filePath,
        ]));
    });

    it('leaves other games and their saves alone', async () => {
        const { red, blue, blueA } = await setup();

        await deleteGame(red);

        assert.ok(await Game.exists({ _id: blue._id }));
        assert.ok(await SaveState.exists({ _id: blueA._id }));
        assert.ok(!deleted.includes(blue.filePath) && !deleted.includes(blueA.filePath));
    });

    it('never deletes a preset cover from the app assets', async () => {
        const { red } = await setup();
        await Game.updateOne({ _id: red._id }, { img: ASSET });

        await deleteGame((await Game.findById(red._id))!);

        assert.ok(!deleted.includes(ASSET));
    });

    it('never deletes a file outside the owner\'s folders, even if a record points at it', async () => {
        const { red } = await setup();
        const someoneElse = `${STORE}/games/misty_at_cerulean-gym/red-9/pokered.gbc`;
        await Game.updateOne({ _id: red._id }, { filePath: someoneElse });

        await deleteGame((await Game.findById(red._id))!);

        assert.ok(!deleted.includes(someoneElse));
    });

    it('keeps Pokémon that left the game for the Ranch', async () => {
        const { ash, red } = await setup();
        const mon = await StoredPokemon.collection.insertOne({ userId: ash._id, sourceGameId: red._id, status: 'stashed' });

        await deleteGame(red);

        assert.ok(await StoredPokemon.exists({ _id: mon.insertedId }));
    });

    it('still deletes the records when a file delete fails', async () => {
        const { red } = await setup();
        mock.method(blobStore, 'del', async () => { throw new Error('store down'); });
        mock.method(console, 'error', () => {});

        const result = await deleteGame(red);

        assert.equal(await Game.exists({ _id: red._id }), null);
        assert.equal(result.files, 0);
    });
});

describe('deleteSave', () => {
    it('deletes the save and its file and screenshot, nothing else', async () => {
        const { red, redA, redB } = await setup();

        await deleteSave(redA);

        assert.equal(await SaveState.exists({ _id: redA._id }), null);
        assert.ok(await SaveState.exists({ _id: redB._id }));
        assert.ok(await Game.exists({ _id: red._id }));
        assert.deepEqual(new Set(deleted), new Set([redA.filePath, redA.img]));
    });
});

describe('deleteUser', () => {
    it('deletes the account, everything it owns, and its files, and nobody else', async () => {
        const { ash } = await setup();
        await Profile.create({ userId: ash._id, username: 'ash', email: ash.email, avatar: `${STORE}/avatars/${SLUG}/me.png` });
        const pen = await RanchPen.create({ userId: ash._id, name: 'Pen 1', order: 0 });
        await StoredPokemon.create({
            userId: ash._id, sourceGameId: new mongoose.Types.ObjectId(), generation: 1,
            sourceSlot: { location: 'party', slotIndex: 0 }, speciesIndex: 25, speciesName: 'PIKACHU',
            otId: 1, level: 5, rawBoxData: Buffer.alloc(33), extractedAt: new Date(), penId: pen._id,
        });
        // A save whose game is already gone still belongs to them
        await SaveState.create({ userId: ash._id, gameId: new mongoose.Types.ObjectId(), title: 'orphan', filePath: `${STORE}/saves/${SLUG}/gone/save.sav` });
        await Notification.create({ userId: String(ash._id), sender: 'SYSTEM', type: 'INFO', title: 'hi' });
        const broadcast = await Notification.create({
            userId: 'BROADCAST', sender: 'SYSTEM', type: 'SYSTEM', title: 'all',
            readBy: [{ userId: String(ash._id), readAt: new Date() }, { userId: 'someone-else', readAt: new Date() }],
        });
        const gary = await User.create({ email: 'gary@pallet.town', passwordHash: 'x', emailVerified: true });
        const garyGame = await Game.create({ userId: gary._id, title: 'Blue', filePath: `${STORE}/games/gary_at_pallet-town/blue/pokeblue.gbc` });

        const result = await deleteUser(String(ash._id));

        assert.deepEqual(result, { games: 2, saves: 4, pokemon: 1, files: 10 });
        for (const model of [Game, SaveState, StoredPokemon, RanchPen, Profile] as const) {
            assert.equal(await (model as typeof Game).countDocuments({ userId: ash._id }), 0, model.modelName);
        }
        assert.equal(await User.exists({ _id: ash._id }), null);
        assert.equal(await Notification.countDocuments({ userId: String(ash._id) }), 0);
        // Their read of the broadcast goes; the broadcast and others' reads stay
        const after = await Notification.findById(broadcast._id).lean();
        assert.deepEqual(after!.readBy!.map((r) => r.userId), ['someone-else']);
        // Gary is untouched
        assert.ok(await User.exists({ _id: gary._id }));
        assert.ok(await Game.exists({ _id: garyGame._id }));
        assert.ok(deleted.includes(`${STORE}/avatars/${SLUG}/me.png`));
        assert.ok(!deleted.some((u) => u.includes('gary')));
    });
});
