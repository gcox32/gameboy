import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { SaveState, StoredPokemon } from '@/models';
import type { ISaveState } from '@/models/SaveState';
import {
    PARTY_BASE, PARTY_DATA, PARTY_NICK, PARTY_OT, PARTY_SPECIES, PLAYER_NAME, SRAM_SIZE,
    SaveSlot, writeMainChecksum,
} from '@/utils/pokemon/gen1Save';
import { injectPokemon } from '@/utils/sramWriter';
import {
    EmptySlotError, STALE_TRANSFER_MS, portToSave, recoverStaleTransfers, resolveStaleTransfer, sendToRanch, takeFromSave,
} from './pokemonTransfer';
import { blobStore, updateSaveRecord } from './saveFile';

const USER = new mongoose.Types.ObjectId();
const GAME = new mongoose.Types.ObjectId();
const OWNER = { identity: 'test', gameTitle: 'red' };
const OLD_URL = 'https://blob.test/old.sav';
const PARTY_0: SaveSlot = { location: 'party', slotIndex: 0 };

function makeSram(): Uint8Array {
    const sram = new Uint8Array(SRAM_SIZE);
    sram.fill(0x50, PLAYER_NAME, PLAYER_NAME + 11);
    sram[PLAYER_NAME] = 0x91;
    const species = [0x99, 0x54, 0xB0];
    sram[PARTY_BASE] = species.length;
    species.forEach((sp, i) => {
        sram[PARTY_SPECIES + i] = sp;
        const data = PARTY_DATA + i * 44;
        sram[data] = sp;
        sram[data + 0x03] = 10 + i;
        sram[data + 0x21] = 10 + i;
        sram.fill(0x50, PARTY_OT + i * 11, PARTY_OT + (i + 1) * 11);
        sram.fill(0x50, PARTY_NICK + i * 11, PARTY_NICK + (i + 1) * 11);
        sram[PARTY_OT + i * 11] = 0x91;
        sram[PARTY_NICK + i * 11] = 0x80 + i;
    });
    sram[PARTY_SPECIES + species.length] = 0xFF;
    writeMainChecksum(sram);
    return sram;
}

let server: MongoMemoryServer;
let blobs: Set<string>;
let uploads = 0;

async function makeSave(filePath = OLD_URL): Promise<ISaveState> {
    blobs.add(filePath);
    return SaveState.create({ userId: USER, gameId: GAME, title: 'save', filePath, connected: true });
}

async function fileOf(save: ISaveState) {
    return (await SaveState.findById(save._id))!.filePath;
}

function send(save: ISaveState, slots: SaveSlot[] = [PARTY_0]) {
    return sendToRanch({ userId: USER.toString(), saveState: save, source: makeSram(), slots, owner: OWNER });
}

async function stash() {
    const save = await makeSave('https://blob.test/source.sav');
    const result = await send(save);
    assert.ok(result.ok);
    return result.created[0];
}

function port(pokemonId: mongoose.Types.ObjectId, save: ISaveState) {
    const patched = injectPokemon(
        makeSram(), Buffer.alloc(33, 1), { nickname: [0x80, 0x50], otName: [0x91, 0x50] }, 1, { location: 'box', boxNumber: 1, slotIndex: 0 },
    );
    return portToSave({ pokemonId, userId: USER.toString(), saveState: save, patched, owner: OWNER });
}

const recoverLater = () => recoverStaleTransfers(USER.toString(), Date.now() + STALE_TRANSFER_MS + 1000);
const countByStatus = (status: string) => StoredPokemon.countDocuments({ status: status as 'stashed' });

// Makes the next call to a model method fail, as if the database went away
function failOnce(model: object, method: string) {
    const stub = mock.method(model as Record<string, () => unknown>, method, () => {
        stub.mock.restore();
        throw new Error(`simulated ${method} failure`);
    });
}

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
    blobs = new Set();
    uploads = 0;
    mock.method(blobStore, 'put', async () => {
        const url = `https://blob.test/new-${++uploads}.sav`;
        blobs.add(url);
        return { url };
    });
    mock.method(blobStore, 'del', async (url: string) => { blobs.delete(url); });
});

afterEach(() => mock.restoreAll());

describe('takeFromSave', () => {
    it('throws on an empty slot without touching the save', () => {
        const sram = makeSram();
        const before = Buffer.from(sram);
        assert.throws(() => takeFromSave(sram, [PARTY_0, { location: 'party', slotIndex: 5 }]), EmptySlotError);
        assert.ok(before.equals(sram));
    });

    it('takes the right Pokémon whatever order the slots arrive in', () => {
        const { taken, sram } = takeFromSave(makeSram(), [PARTY_0, { location: 'party', slotIndex: 2 }]);
        assert.deepEqual(taken.map(t => t.pokemon.speciesIndex).sort(), [0x99, 0xB0].sort());
        assert.equal(sram[PARTY_BASE], 1);
        assert.equal(sram[PARTY_SPECIES], 0x54);
    });
});

describe('sendToRanch', () => {
    it('stashes the Pokémon, moves the save to the new file, and removes the old one', async () => {
        const save = await makeSave();
        const result = await send(save);

        assert.ok(result.ok);
        assert.equal(result.created.length, 1);
        assert.equal(result.created[0].status, 'stashed');
        assert.equal(result.created[0].transfer, undefined);
        assert.equal(result.created[0].nicknameBytes?.length, 11);
        assert.equal(await fileOf(save), result.updatedFilePath);
        assert.deepEqual([...blobs], [result.updatedFilePath]);
    });

    it('changes nothing if the upload fails', async () => {
        const save = await makeSave();
        mock.method(blobStore, 'put', async () => { throw new Error('upload failed'); });

        await assert.rejects(send(save), /upload failed/);
        assert.equal(await StoredPokemon.countDocuments(), 0);
        assert.equal(await fileOf(save), OLD_URL);
    });

    it('changes nothing if the records cannot be written', async () => {
        const save = await makeSave();
        failOnce(StoredPokemon, 'insertMany');

        await assert.rejects(send(save), /insertMany/);
        assert.equal(await StoredPokemon.countDocuments(), 0);
        assert.equal(await fileOf(save), OLD_URL);
        assert.deepEqual([...blobs], [OLD_URL]);
    });

    it('backs out if the save changed after it was read', async () => {
        const save = await makeSave();
        await SaveState.updateOne({ _id: save._id }, { filePath: 'https://blob.test/other.sav' });

        assert.deepEqual(await send(save), { ok: false, reason: 'save_changed' });
        assert.equal(await StoredPokemon.countDocuments(), 0);
        assert.equal(await fileOf(save), 'https://blob.test/other.sav');
    });

    it('lets only one of two simultaneous requests through', async () => {
        const save = await makeSave();
        const results = await Promise.all([send(save), send(save)]);

        assert.equal(results.filter(r => r.ok).length, 1);
        assert.equal(await StoredPokemon.countDocuments(), 1);
    });

    it('still succeeds if marking stashed fails, and recovery finishes the job', async () => {
        const save = await makeSave();
        failOnce(StoredPokemon, 'updateMany');
        mock.method(console, 'error', () => {});

        const result = await send(save);
        assert.ok(result.ok);
        assert.equal(await countByStatus('transferring'), 1);

        await recoverLater();
        assert.equal(await countByStatus('stashed'), 1);
        assert.equal(await countByStatus('transferring'), 0);
    });

    it('recovers correctly when the request dies before the save was updated', async () => {
        const save = await makeSave();
        failOnce(SaveState, 'updateOne');

        await assert.rejects(send(save));
        assert.equal(await countByStatus('transferring'), 1);
        assert.equal(await StoredPokemon.countDocuments({ status: 'stashed' }), 0);

        // The Pokémon is still in the save, so the record must go or it would be a duplicate.
        await recoverLater();
        assert.equal(await StoredPokemon.countDocuments(), 0);
    });
});

describe('portToSave', () => {
    it('moves the save to the new file and deletes the Ranch record', async () => {
        const pokemon = await stash();
        const target = await makeSave();

        const result = await port(pokemon._id as mongoose.Types.ObjectId, target);
        assert.ok(result.ok);
        assert.equal(await StoredPokemon.countDocuments(), 0);
        assert.equal(await fileOf(target), result.updatedFilePath);
        assert.ok(!blobs.has(OLD_URL));
    });

    it('lets one Pokémon into only one save when two ports race', async () => {
        const pokemon = await stash();
        const [a, b] = [await makeSave('https://blob.test/a.sav'), await makeSave('https://blob.test/b.sav')];
        const id = pokemon._id as mongoose.Types.ObjectId;

        const results = await Promise.all([port(id, a), port(id, b)]);
        assert.equal(results.filter(r => r.ok).length, 1);
        assert.deepEqual(results.filter(r => !r.ok), [{ ok: false, reason: 'not_stashed' }]);

        const unchanged = [await fileOf(a), await fileOf(b)].filter(f => f.endsWith('/a.sav') || f.endsWith('/b.sav'));
        assert.equal(unchanged.length, 1);
        assert.equal(await StoredPokemon.countDocuments(), 0);
    });

    it('returns the Pokémon to the Ranch if the save changed after it was read', async () => {
        const pokemon = await stash();
        const target = await makeSave();
        await SaveState.updateOne({ _id: target._id }, { filePath: 'https://blob.test/other.sav' });

        assert.deepEqual(await port(pokemon._id as mongoose.Types.ObjectId, target), { ok: false, reason: 'save_changed' });
        const record = await StoredPokemon.findById(pokemon._id);
        assert.equal(record?.status, 'stashed');
        assert.equal(record?.transfer, undefined);
    });

    it('leaves the record alone if the upload fails', async () => {
        const pokemon = await stash();
        const target = await makeSave();
        mock.method(blobStore, 'put', async () => { throw new Error('upload failed'); });

        await assert.rejects(port(pokemon._id as mongoose.Types.ObjectId, target), /upload failed/);
        assert.equal((await StoredPokemon.findById(pokemon._id))?.status, 'stashed');
    });

    it('returns the Pokémon if the request dies before the save was updated', async () => {
        const pokemon = await stash();
        const target = await makeSave();
        failOnce(SaveState, 'updateOne');

        await assert.rejects(port(pokemon._id as mongoose.Types.ObjectId, target));
        assert.equal((await StoredPokemon.findById(pokemon._id))?.status, 'transferring');

        await recoverLater();
        assert.equal((await StoredPokemon.findById(pokemon._id))?.status, 'stashed');
    });

    it('removes the record if the request dies just after the save was updated', async () => {
        const pokemon = await stash();
        const target = await makeSave();
        failOnce(StoredPokemon, 'deleteOne');
        mock.method(console, 'error', () => {});

        assert.ok((await port(pokemon._id as mongoose.Types.ObjectId, target)).ok);
        assert.equal((await StoredPokemon.findById(pokemon._id))?.status, 'transferring');

        await recoverLater();
        assert.equal(await StoredPokemon.countDocuments(), 0);
    });
});

describe('recovery', () => {
    it('leaves transfers that may still be running', async () => {
        const save = await makeSave();
        failOnce(StoredPokemon, 'updateMany');
        mock.method(console, 'error', () => {});
        await send(save);

        await recoverStaleTransfers(USER.toString());
        assert.equal(await countByStatus('transferring'), 1);
    });

    it("only touches the user's own records", async () => {
        const save = await makeSave();
        failOnce(StoredPokemon, 'updateMany');
        mock.method(console, 'error', () => {});
        await send(save);

        await recoverStaleTransfers(new mongoose.Types.ObjectId().toString(), Date.now() + STALE_TRANSFER_MS + 1000);
        assert.equal(await countByStatus('transferring'), 1);
    });

    it('keeps the Pokémon whenever the outcome is unclear', () => {
        const movedOn = { arrived: false, untouched: false };
        assert.equal(resolveStaleTransfer('to_ranch', movedOn), 'stash');
        assert.equal(resolveStaleTransfer('to_save', movedOn), 'stash');

        assert.equal(resolveStaleTransfer('to_ranch', { arrived: true, untouched: false }), 'stash');
        assert.equal(resolveStaleTransfer('to_ranch', { arrived: false, untouched: true }), 'delete');
        assert.equal(resolveStaleTransfer('to_save', { arrived: true, untouched: false }), 'delete');
        assert.equal(resolveStaleTransfer('to_save', { arrived: false, untouched: true }), 'stash');
    });
});

describe('updateSaveRecord', () => {
    it('applies a new file when the client has the current one', async () => {
        const save = await makeSave();
        const updated = await updateSaveRecord(save, { filePath: 'https://blob.test/game.sav', img: 'a.png' }, OLD_URL);
        assert.equal(updated?.filePath, 'https://blob.test/game.sav');
        assert.equal(updated?.img, 'a.png');
    });

    it('refuses a new file from a client holding an older one, changing nothing', async () => {
        const save = await makeSave();
        await SaveState.updateOne({ _id: save._id }, { filePath: 'https://blob.test/lab.sav' });

        const updated = await updateSaveRecord(save, { filePath: 'https://blob.test/game.sav', img: 'a.png' }, OLD_URL);
        assert.equal(updated, null);
        const current = await SaveState.findById(save._id);
        assert.equal(current?.filePath, 'https://blob.test/lab.sav');
        assert.equal(current?.img, undefined);
    });

    it('saves over a changed file once the client names it', async () => {
        const save = await makeSave();
        await SaveState.updateOne({ _id: save._id }, { filePath: 'https://blob.test/lab.sav' });

        const updated = await updateSaveRecord(save, { filePath: 'https://blob.test/game.sav' }, 'https://blob.test/lab.sav');
        assert.equal(updated?.filePath, 'https://blob.test/game.sav');
    });

    it("doesn't need the check for edits that leave the file alone", async () => {
        const save = await makeSave();
        await SaveState.updateOne({ _id: save._id }, { description: 'old' });
        const updated = await updateSaveRecord(save, { description: 'new', filePath: save.filePath });
        assert.equal(updated?.description, 'new');
    });

    it('still rejects an invalid edit', async () => {
        const save = await makeSave();
        await assert.rejects(updateSaveRecord(save, { title: '' }));
    });

    it('stops the Lab overwriting an emulator save, and the reverse', async () => {
        const save = await makeSave();

        // The emulator saves while a Lab request is in flight
        await updateSaveRecord(save, { filePath: 'https://blob.test/game.sav' }, OLD_URL);
        assert.deepEqual(await send(save), { ok: false, reason: 'save_changed' });
        assert.equal(await StoredPokemon.countDocuments(), 0);
        assert.equal(await fileOf(save), 'https://blob.test/game.sav');

        // The Lab writes while the emulator holds the file it loaded
        const labSave = (await SaveState.findById(save._id))!;
        const result = await send(labSave);
        assert.ok(result.ok);
        assert.equal(await updateSaveRecord(labSave, { filePath: 'https://blob.test/game2.sav' }, labSave.filePath), null);
        assert.equal(await fileOf(save), result.updatedFilePath);
    });
});
