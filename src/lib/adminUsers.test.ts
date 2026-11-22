import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { Game, Notification, Profile, RanchPen, RateLimit, SaveState, StoredPokemon, User } from '@/models';
import { loadAccountDetail, loadAccounts } from './adminUsers';

let server: MongoMemoryServer;

before(async () => {
    server = await MongoMemoryServer.create();
    await mongoose.connect(server.getUri());
});

after(async () => {
    await mongoose.disconnect();
    await server.stop();
});

beforeEach(() => mongoose.connection.dropDatabase());

const pokemonFor = (userId: mongoose.Types.ObjectId, extra: Record<string, unknown>) => StoredPokemon.create({
    userId, sourceGameId: new mongoose.Types.ObjectId(), generation: 1,
    sourceSlot: { location: 'box', boxNumber: 1, slotIndex: 0 }, speciesIndex: 84, speciesName: 'PIKACHU',
    nickname: 'SPARKY', otName: 'ASH', otId: 1, level: 12, rawBoxData: Buffer.alloc(33), extractedAt: new Date(),
    ...extra,
});

async function setup() {
    const ash = await User.create({ email: 'ash@pallet.town', passwordHash: 'x', emailVerified: true });
    await Profile.create({ userId: ash._id, username: 'ash', email: ash.email });
    const red = await Game.create({ userId: ash._id, title: 'Red', filePath: 'r', metadata: { generation: 1 } });
    const crystal = await Game.create({ userId: ash._id, title: 'Crystal', filePath: 'c' });
    await SaveState.create({ userId: ash._id, gameId: red._id, title: 'Before Brock', filePath: 's1' });
    await SaveState.create({ userId: ash._id, gameId: red._id, title: 'After Brock', filePath: 's2' });
    const pen = await RanchPen.create({ userId: ash._id, name: 'Meadow', order: 0 });
    await pokemonFor(ash._id, { sourceGameId: red._id, penId: pen._id });
    // From a game deleted since, waiting for a pen, mid-move
    await pokemonFor(ash._id, { speciesName: 'EEVEE', nickname: '', status: 'transferring' });
    await Notification.create({ userId: String(ash._id), sender: 'SYSTEM', type: 'INFO', title: 'Welcome' });
    await RateLimit.create({ key: 'login:email:ash@pallet.town', count: 11, expiresAt: new Date(Date.now() + 60_000) });

    // Someone else, who must not leak in
    const gary = await User.create({ email: 'gary@pallet.town', passwordHash: 'x' });
    await Game.create({ userId: gary._id, title: 'Blue', filePath: 'b' });
    return { ash, gary, red, crystal, pen };
}

describe('loadAccounts', () => {
    it('lists every account with counts, including one without a profile', async () => {
        const { ash, gary } = await setup();
        const rows = await loadAccounts();
        const byId = Object.fromEntries(rows.map((r) => [r.userId, r]));

        assert.equal(rows.length, 2);
        assert.deepEqual(
            { games: byId[String(ash._id)].games, saves: byId[String(ash._id)].saves, pokemon: byId[String(ash._id)].pokemon },
            { games: 2, saves: 2, pokemon: 2 },
        );
        assert.equal(byId[String(ash._id)].limits[0].blocked, true);
        assert.equal(byId[String(gary._id)].hasProfile, false);
        assert.equal(byId[String(gary._id)].games, 1);
    });

    it('limits to the accounts asked for', async () => {
        const { gary } = await setup();
        const rows = await loadAccounts([String(gary._id)]);
        assert.deepEqual(rows.map((r) => r.email), ['gary@pallet.town']);
    });
});

describe('loadAccountDetail', () => {
    it("joins up everything the account owns, and nothing of anyone else's", async () => {
        const { ash, red, pen } = await setup();
        const detail = (await loadAccountDetail(String(ash._id)))!;

        assert.equal(detail.account.email, 'ash@pallet.town');
        assert.deepEqual(detail.games.map((g) => [g.title, g.saves, g.generation]).sort(), [['Crystal', 0, undefined], ['Red', 2, 1]]);
        assert.ok(detail.saves.every((s) => s.gameId === String(red._id) && s.gameTitle === 'Red'));
        assert.deepEqual(detail.pens, [{ id: String(pen._id), name: 'Meadow', order: 0, pokemon: 1 }]);

        const bySpecies = Object.fromEntries(detail.pokemon.map((p) => [p.speciesName, p]));
        assert.equal(bySpecies.PIKACHU.penName, 'Meadow');
        assert.equal(bySpecies.PIKACHU.sourceGameTitle, 'Red');
        assert.equal(bySpecies.EEVEE.penName, undefined);
        assert.equal(bySpecies.EEVEE.sourceGameTitle, undefined);
        assert.equal(bySpecies.EEVEE.transferring, true);

        assert.deepEqual(detail.notifications.map((n) => n.title), ['Welcome']);
    });

    it('is null for an account that does not exist', async () => {
        assert.equal(await loadAccountDetail(String(new mongoose.Types.ObjectId())), null);
    });
});
