import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { Game, Profile, RateLimit, SaveState, User } from '@/models';
import { clampPage, parsePaging, type PageQuery } from './paging';
import { pageAccounts, type AccountSort } from './adminUsers';
import { pageGames, type GameSort } from './adminGames';

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

describe('parsePaging', () => {
    it('reads what it knows and falls back on the rest', () => {
        const parse = (qs: string) => parsePaging(new URLSearchParams(qs), ['a', 'b'] as const, { sort: 'a', dir: -1 });
        assert.deepEqual(parse('page=3&pageSize=10&q=%20ash%20&sort=b&dir=asc'), { page: 3, pageSize: 10, q: 'ash', sort: 'b', dir: 1 });
        assert.deepEqual(parse('page=-2&pageSize=5000&sort=zzz&dir=up'), { page: 1, pageSize: 100, q: '', sort: 'a', dir: -1 });
    });

    it('clamps a page past the end to the last', () => {
        assert.equal(clampPage(9, 25, 60), 3);
        assert.equal(clampPage(2, 25, 0), 1);
        assert.equal(clampPage(2, 25, 60), 2);
    });
});

const q = <S extends string>(sort: S, extra: Partial<PageQuery<S>> = {}): PageQuery<S> =>
    ({ page: 1, pageSize: 25, q: '', sort, dir: 1, ...extra });

async function people() {
    const day = 86_400_000;
    const mk = async (email: string, username: string | null, extra: object, age: number) => {
        const u = await User.create({ email, passwordHash: 'x', createdAt: new Date(Date.now() - age * day), ...extra });
        if (username) await Profile.create({ userId: u._id, username, email });
        return u;
    };
    const ash = await mk('ash@pallet.town', 'Ash', { emailVerified: true }, 3);
    const brock = await mk('brock@pewter.city', 'brock', { emailVerified: true, admin: true }, 2);
    const misty = await mk('misty@cerulean.city', null, {}, 1);
    for (let i = 0; i < 3; i++) await Game.create({ userId: brock._id, title: `Game ${i}`, filePath: 'f' });
    await Game.create({ userId: ash._id, title: 'Red', filePath: 'f', metadata: { generation: 1, series: 'Pokémon' } });
    return { ash, brock, misty };
}

describe('pageAccounts', () => {
    it('pages newest first, with the total', async () => {
        await people();
        const first = await pageAccounts(q<AccountSort>('joined', { dir: -1, pageSize: 2 }));
        assert.deepEqual(first.rows.map((r) => r.email), ['misty@cerulean.city', 'brock@pewter.city']);
        assert.equal(first.total, 3);
        const second = await pageAccounts(q<AccountSort>('joined', { dir: -1, pageSize: 2, page: 2 }));
        assert.deepEqual(second.rows.map((r) => r.email), ['ash@pallet.town']);
    });

    it('sends the last page when asked for one past the end', async () => {
        await people();
        const page = await pageAccounts(q<AccountSort>('joined', { pageSize: 2, page: 7 }));
        assert.equal(page.page, 2);
        assert.equal(page.rows.length, 1);
    });

    it('sorts by username ignoring case, and by what they own', async () => {
        await people();
        // Misty has no profile, so no username, which sorts first
        assert.deepEqual((await pageAccounts(q<AccountSort>('username'))).rows.map((r) => r.username), ['', 'Ash', 'brock']);
        assert.deepEqual((await pageAccounts(q<AccountSort>('games', { dir: -1 }))).rows.map((r) => r.games), [3, 1, 0]);
    });

    it('searches email and username, and filters', async () => {
        const { ash } = await people();
        assert.deepEqual((await pageAccounts(q<AccountSort>('email', { q: 'city' }))).rows.map((r) => r.email), ['brock@pewter.city', 'misty@cerulean.city']);
        assert.deepEqual((await pageAccounts(q<AccountSort>('email', { q: 'ASH' }))).rows.map((r) => r.userId), [String(ash._id)]);
        // A search is text, not a pattern
        assert.equal((await pageAccounts(q<AccountSort>('email', { q: '.*' }))).total, 0);

        assert.deepEqual((await pageAccounts(q<AccountSort>('email'), 'admin')).rows.map((r) => r.email), ['brock@pewter.city']);
        assert.deepEqual((await pageAccounts(q<AccountSort>('email'), 'unverified')).rows.map((r) => r.email), ['misty@cerulean.city']);
        await RateLimit.create({ key: 'login:email:ash@pallet.town', count: 99, expiresAt: new Date(Date.now() + 60_000) });
        assert.deepEqual((await pageAccounts(q<AccountSort>('email'), 'limited')).rows.map((r) => r.email), ['ash@pallet.town']);
    });
});

describe('pageGames', () => {
    it('joins owners and save counts, and searches by owner', async () => {
        const { ash } = await people();
        const red = await Game.findOne({ title: 'Red' });
        await SaveState.create({ userId: ash._id, gameId: red!._id, title: 's', filePath: 's' });

        const page = await pageGames(q<GameSort>('title', { q: 'pallet' }));
        assert.equal(page.total, 1);
        assert.deepEqual(
            { title: page.rows[0].title, ownerEmail: page.rows[0].ownerEmail, ownerName: page.rows[0].ownerName, saves: page.rows[0].saves, userId: page.rows[0].userId },
            { title: 'Red', ownerEmail: 'ash@pallet.town', ownerName: 'Ash', saves: 1, userId: String(ash._id) },
        );
    });

    it('sorts titles with numbers in order, by owner, and filters by generation', async () => {
        await people();
        await Game.create({ userId: new mongoose.Types.ObjectId(), title: 'Game 10', filePath: 'f' });

        assert.deepEqual((await pageGames(q<GameSort>('title'))).rows.map((g) => g.title), ['Game 0', 'Game 1', 'Game 2', 'Game 10', 'Red']);
        // The game whose owner is gone has no email, which sorts first
        assert.deepEqual((await pageGames(q<GameSort>('owner'))).rows.map((g) => g.ownerEmail ?? null)[0], null);
        assert.deepEqual((await pageGames(q<GameSort>('title'), '1')).rows.map((g) => g.title), ['Red']);
        assert.equal((await pageGames(q<GameSort>('title'), 'none')).total, 4);
    });
});
