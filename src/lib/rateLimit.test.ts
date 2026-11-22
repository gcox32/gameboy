import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { RateLimit } from '@/models';
import { AUTH_LIMITS, clientIp, hit, limitAuth } from './rateLimit';

let server: MongoMemoryServer;

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
    await RateLimit.deleteMany({});
});

describe('hit', () => {
    it('allows up to max requests, then blocks with a retry time', async () => {
        const limit = { key: 'k', max: 3, windowMs: 60_000 };
        for (let i = 0; i < 3; i++) assert.equal((await hit(limit)).ok, true);

        const blocked = await hit(limit);
        assert.equal(blocked.ok, false);
        assert.ok(blocked.retryAfter > 0 && blocked.retryAfter <= 60);
    });

    it('starts a new window once the old one has expired, even before the TTL sweep deletes it', async () => {
        await RateLimit.create({ key: 'k', count: 99, expiresAt: new Date(Date.now() - 1000) });

        assert.equal((await hit({ key: 'k', max: 3, windowMs: 60_000 })).ok, true);
        const doc = await RateLimit.findOne({ key: 'k' }).lean();
        assert.equal(doc?.count, 1);
        assert.ok(doc!.expiresAt.getTime() > Date.now());
    });

    it('counts every concurrent request exactly once', async () => {
        const limit = { key: 'race', max: 5, windowMs: 60_000 };
        const results = await Promise.all(Array.from({ length: 20 }, () => hit(limit)));

        assert.equal(results.filter((r) => r.ok).length, 5);
        assert.equal((await RateLimit.findOne({ key: 'race' }).lean())?.count, 20);
    });

    it('keeps keys independent', async () => {
        const a = { key: 'a', max: 1, windowMs: 60_000 };
        await hit(a);
        assert.equal((await hit(a)).ok, false);
        assert.equal((await hit({ ...a, key: 'b' })).ok, true);
    });
});

describe('limitAuth', () => {
    it('blocks an email across different IPs', async () => {
        const { max } = AUTH_LIMITS.login.email;
        for (let i = 0; i < max; i++) {
            assert.equal((await limitAuth('login', { email: 'ash@pallet.town', ip: `10.0.0.${i}` })).ok, true);
        }
        // Case and whitespace don't make it a different email
        assert.equal((await limitAuth('login', { email: ' ASH@pallet.town ', ip: '10.0.1.1' })).ok, false);
        assert.equal((await limitAuth('login', { email: 'misty@cerulean.city', ip: '10.0.1.1' })).ok, true);
    });

    it('blocks an IP across different emails', async () => {
        const { max } = AUTH_LIMITS.resendVerification.ip;
        for (let i = 0; i < max; i++) {
            assert.equal((await limitAuth('resendVerification', { email: `t${i}@x.co`, ip: '1.2.3.4' })).ok, true);
        }
        assert.equal((await limitAuth('resendVerification', { email: 'new@x.co', ip: '1.2.3.4' })).ok, false);
    });

    it('applies IP-only limits when there is no email', async () => {
        const { max } = AUTH_LIMITS.register.ip;
        for (let i = 0; i < max; i++) assert.equal((await limitAuth('register', { ip: '5.6.7.8' })).ok, true);
        assert.equal((await limitAuth('register', { ip: '5.6.7.8' })).ok, false);
    });
});

describe('clientIp', () => {
    it('takes the first x-forwarded-for address', () => {
        assert.equal(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' })), '203.0.113.7');
    });

    it('falls back to x-real-ip, then undefined', () => {
        assert.equal(clientIp(new Headers({ 'x-real-ip': '203.0.113.8' })), '203.0.113.8');
        assert.equal(clientIp(new Headers()), undefined);
    });
});
