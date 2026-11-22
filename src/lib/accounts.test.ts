import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { RateLimit, User } from '@/models';
import { mailer } from './email';
import { limitAuth } from './rateLimit';
import { clearEmailLimits, emailLimits, markEmailVerified, sendPasswordReset, sendVerificationCode } from './accounts';

let server: MongoMemoryServer;
let sent: { kind: string; to: string; token: string }[];

before(async () => {
    server = await MongoMemoryServer.create();
    await mongoose.connect(server.getUri());
    await RateLimit.syncIndexes();
});

after(async () => {
    await mongoose.disconnect();
    await server.stop();
});

beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    await RateLimit.syncIndexes();
    sent = [];
    mock.method(mailer, 'sendVerificationEmail', async (to: string, token: string) => { sent.push({ kind: 'verify', to, token }); });
    mock.method(mailer, 'sendPasswordResetEmail', async (to: string, token: string) => { sent.push({ kind: 'reset', to, token }); });
});

afterEach(() => mock.restoreAll());

const newUser = (email = 'ash@pallet.town', emailVerified = false) =>
    User.create({ email, passwordHash: 'x', emailVerified });

describe('sendVerificationCode', () => {
    it('stores a 6-digit code valid for a day and emails that same code', async () => {
        const ash = await newUser();
        await sendVerificationCode(ash);

        const stored = await User.findById(ash._id).lean();
        assert.match(stored!.verificationToken!, /^\d{6}$/);
        const hoursLeft = (stored!.verificationTokenExpiry!.getTime() - Date.now()) / 3_600_000;
        assert.ok(hoursLeft > 23.9 && hoursLeft <= 24);
        assert.deepEqual(sent, [{ kind: 'verify', to: 'ash@pallet.town', token: stored!.verificationToken }]);
    });

    it('lets a failed send throw, with the new code already stored', async () => {
        const ash = await newUser();
        mock.method(mailer, 'sendVerificationEmail', async () => { throw new Error('Email not sent: quota'); });

        await assert.rejects(sendVerificationCode(ash), /quota/);
        assert.ok((await User.findById(ash._id).lean())!.verificationToken);
    });
});

describe('sendPasswordReset', () => {
    it('stores a reset token valid for an hour and emails it', async () => {
        const ash = await newUser();
        await sendPasswordReset(ash);

        const stored = await User.findById(ash._id).lean();
        assert.match(stored!.resetToken!, /^[0-9a-f]{64}$/);
        const minutesLeft = (stored!.resetTokenExpiry!.getTime() - Date.now()) / 60_000;
        assert.ok(minutesLeft > 59.9 && minutesLeft <= 60);
        assert.deepEqual(sent, [{ kind: 'reset', to: 'ash@pallet.town', token: stored!.resetToken }]);
    });
});

describe('markEmailVerified', () => {
    it('verifies the email and drops any pending code', async () => {
        const ash = await newUser();
        await sendVerificationCode(ash);
        await markEmailVerified(ash._id);

        const stored = await User.findById(ash._id).lean();
        assert.equal(stored!.emailVerified, true);
        assert.equal(stored!.verificationToken, undefined);
        assert.equal(stored!.verificationTokenExpiry, undefined);
    });
});

describe('emailLimits and clearEmailLimits', () => {
    it("reports each open per-email window with its limit, and whether it's blocking", async () => {
        for (let i = 0; i < 4; i++) await limitAuth('forgotPassword', { email: 'Ash@Pallet.town', ip: '1.2.3.4' });
        await limitAuth('login', { email: 'ash@pallet.town', ip: '1.2.3.4' });

        const ash = (await emailLimits()).get('ash@pallet.town')!;
        const byAction = Object.fromEntries(ash.map((l) => [l.action, l]));
        assert.deepEqual(Object.keys(byAction).sort(), ['forgotPassword', 'login']);
        assert.equal(byAction.forgotPassword.count, 4);
        assert.equal(byAction.forgotPassword.max, 3);
        assert.equal(byAction.forgotPassword.blocked, true);
        assert.equal(byAction.login.blocked, false);
    });

    it('leaves out windows that have ended', async () => {
        await RateLimit.create({ key: 'login:email:ash@pallet.town', count: 50, expiresAt: new Date(Date.now() - 1000) });
        assert.equal((await emailLimits()).size, 0);
    });

    it("clears one email's windows only, leaving IP windows and other emails alone", async () => {
        await limitAuth('login', { email: 'ash@pallet.town', ip: '1.2.3.4' });
        await limitAuth('forgotPassword', { email: 'ash@pallet.town' });
        await limitAuth('login', { email: 'gary@pallet.town' });
        // A different email that would match a loose pattern: '.' must not match any character
        await limitAuth('login', { email: 'ash@palletXtown' });

        assert.equal(await clearEmailLimits(' ASH@pallet.town '), 2);
        const keys = (await RateLimit.find().lean()).map((r) => r.key).sort();
        assert.deepEqual(keys, ['login:email:ash@palletxtown', 'login:email:gary@pallet.town', 'login:ip:1.2.3.4']);
    });
});
