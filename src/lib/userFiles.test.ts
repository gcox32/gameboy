import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { Game, SaveState, StoredPokemon, User } from '@/models';
import { blobStore } from './saveFile';
import { deleteGame, deleteSave } from './userFiles';

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
