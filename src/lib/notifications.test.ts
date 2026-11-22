import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { Notification, User } from '@/models';
import { MAX_EXPIRY_MS, notExpired, validateDraft } from './notifications';

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

const NOW = Date.parse('2026-11-22T12:00:00Z');
const at = (ms: number) => new Date(NOW + ms).toISOString();

describe('validateDraft', () => {
    it('accepts a broadcast and trims it', async () => {
        const result = await validateDraft({ userId: 'BROADCAST', type: 'SYSTEM', title: '  Hi ', body: ' there ' }, NOW);
        assert.ok(result.error === undefined);
        assert.deepEqual(result.draft, { userId: 'BROADCAST', type: 'SYSTEM', title: 'Hi', body: 'there' });
    });

    it('accepts one account, with its email and an expiry', async () => {
        const ash = await User.create({ email: 'ash@pallet.town', passwordHash: 'x' });
        const result = await validateDraft({ userId: String(ash._id), type: 'INFO', title: 'Yo', expiresAt: at(60_000) }, NOW);
        assert.ok(result.error === undefined);
        assert.equal(result.recipientEmail, 'ash@pallet.town');
        assert.equal(result.draft.expiresAt?.toISOString(), at(60_000));
    });

    it('turns away what it should', async () => {
        const ok = { userId: 'BROADCAST', type: 'SYSTEM', title: 'Hi' };
        const cases: [Record<string, unknown>, number][] = [
            [{ ...ok, title: '  ' }, 400],
            [{ ...ok, title: 'x'.repeat(121) }, 400],
            [{ ...ok, type: 'FRIEND_REQUEST' }, 400],
            [{ ...ok, expiresAt: at(-1) }, 400],
            [{ ...ok, expiresAt: at(MAX_EXPIRY_MS + 1) }, 400],
            [{ ...ok, expiresAt: 'soon' }, 400],
            [{ ...ok, userId: 'ash' }, 400],
            [{ ...ok, userId: String(new mongoose.Types.ObjectId()) }, 404],
        ];
        for (const [input, status] of cases) {
            const result = await validateDraft(input, NOW);
            assert.equal('status' in result && result.status, status, JSON.stringify(input));
        }
    });
});

describe('notExpired', () => {
    it('keeps the ones without an expiry or not yet expired', async () => {
        const base = { userId: 'BROADCAST', sender: 'SYSTEM', type: 'INFO' as const };
        await Notification.create([
            { ...base, title: 'forever' },
            { ...base, title: 'later', expiresAt: new Date(Date.now() + 60_000) },
            { ...base, title: 'gone', expiresAt: new Date(Date.now() - 1_000) },
        ]);
        const titles = (await Notification.find(notExpired()).lean()).map((n) => n.title).sort();
        assert.deepEqual(titles, ['forever', 'later']);
    });
});
