import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import type { Session } from 'next-auth';
import { AuditEntry, User } from '@/models';
import { actingForOthers, listAudit, recordAudit } from './audit';

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

const oak = { user: { id: 'oak-id', email: 'oak@pallet.town', admin: true }, expires: '' } as Session;

describe('recordAudit', () => {
    it('records the admin and fills in the owner email', async () => {
        const ash = await User.create({ email: 'ash@pallet.town', passwordHash: 'x' });
        await recordAudit(oak, { action: 'game.delete', targetUserId: String(ash._id), targetLabel: 'Red', details: { saves: 2 } });

        const [entry] = await AuditEntry.find().lean();
        assert.equal(entry.actorEmail, 'oak@pallet.town');
        assert.equal(entry.targetEmail, 'ash@pallet.town');
        assert.deepEqual(entry.details, { saves: 2 });
    });

    it("doesn't throw when the write fails", async () => {
        // Not an action the schema allows, so the create rejects
        await recordAudit(oak, { action: 'nope' as never });
        assert.equal(await AuditEntry.countDocuments(), 0);
    });

    it('tells acting for others from acting for yourself', () => {
        assert.equal(actingForOthers(oak, 'oak-id'), false);
        assert.equal(actingForOthers(oak, new mongoose.Types.ObjectId()), true);
    });
});

describe('listAudit', () => {
    async function seed(n: number, extra: (i: number) => object = () => ({})) {
        for (let i = 0; i < n; i++) {
            await AuditEntry.create({ actorId: 'oak-id', actorEmail: 'oak@pallet.town', action: 'user.verifyEmail', ...extra(i) });
        }
    }

    it('pages newest first without repeats or gaps', async () => {
        await seed(5, (i) => ({ targetLabel: `#${i}` }));
        const first = await listAudit({ limit: 2 });
        const second = await listAudit({ limit: 2, before: first.next! });
        const third = await listAudit({ limit: 2, before: second.next! });

        assert.deepEqual(
            [...first.entries, ...second.entries, ...third.entries].map((e) => e.targetLabel),
            ['#4', '#3', '#2', '#1', '#0'],
        );
        assert.equal(third.next, null);
    });

    it('filters by account and by group', async () => {
        await seed(2, (i) => ({ targetUserId: i ? 'ash' : 'gary' }));
        await AuditEntry.create({ actorId: 'oak-id', actorEmail: 'oak@pallet.town', action: 'storage.deleteOrphans' });

        assert.equal((await listAudit({ userId: 'ash' })).entries.length, 1);
        assert.deepEqual((await listAudit({ group: 'storage' })).entries.map((e) => e.action), ['storage.deleteOrphans']);
    });
});
