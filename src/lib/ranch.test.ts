import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { RanchPen, StoredPokemon } from '@/models';
import { PEN_CAPACITY, addPen, settleRanch } from './ranch';
import { CORRAL, depthScale, onGround, seededRandom, spreadSpots } from '@/components/ranch/fields';

const USER = new mongoose.Types.ObjectId();
const userId = USER.toString();

let server: MongoMemoryServer;
let arrivals = 0;

function arrive(count: number, extra: Record<string, unknown> = {}) {
    return StoredPokemon.insertMany(Array.from({ length: count }, () => ({
        userId: USER,
        sourceGameId: new mongoose.Types.ObjectId(),
        generation: 1,
        sourceSlot: { location: 'box', boxNumber: 1, slotIndex: 0 },
        speciesIndex: 84,
        speciesName: 'pikachu',
        otId: 1,
        level: 5,
        rawBoxData: Buffer.alloc(33),
        // Strictly increasing, so the order they arrived in is known
        extractedAt: new Date(Date.UTC(2026, 0, 1) + arrivals++ * 1000),
        ...extra,
    })));
}

async function penCounts(): Promise<number[]> {
    const pens = await RanchPen.find({ userId: USER }).sort({ order: 1 });
    return Promise.all(pens.map(p => StoredPokemon.countDocuments({ userId: USER, penId: p._id })));
}

before(async () => {
    server = await MongoMemoryServer.create();
    await mongoose.connect(server.getUri());
    await RanchPen.syncIndexes();
});

after(async () => {
    await mongoose.disconnect();
    await server.stop();
});

beforeEach(async () => {
    await StoredPokemon.deleteMany({});
    await RanchPen.deleteMany({});
    arrivals = 0;
});

describe('settleRanch', () => {
    it('gives a new user their first pen, even with no Pokémon', async () => {
        const pens = await settleRanch(userId);
        assert.equal(pens.length, 1);
        assert.equal(pens[0].name, 'Pen 1');
    });

    it('settles arrivals into the first pen with room, and opens a pen when all are full', async () => {
        await arrive(PEN_CAPACITY + 3);
        const pens = await settleRanch(userId);
        assert.deepEqual(pens.map(p => p.name), ['Pen 1', 'Pen 2']);
        assert.deepEqual(await penCounts(), [PEN_CAPACITY, 3]);
        assert.equal(await StoredPokemon.countDocuments({ penId: null }), 0);
    });

    it('fills a gap in an earlier pen before a later one', async () => {
        await arrive(PEN_CAPACITY + 1);
        await settleRanch(userId);
        await StoredPokemon.deleteOne({ extractedAt: new Date(Date.UTC(2026, 0, 1)) });
        await arrive(2);
        await settleRanch(userId);
        assert.deepEqual(await penCounts(), [PEN_CAPACITY, 2]);
    });

    it('rehomes Pokémon whose pen is gone', async () => {
        await arrive(2, { penId: new mongoose.Types.ObjectId() });
        await settleRanch(userId);
        assert.deepEqual(await penCounts(), [2]);
    });

    it('leaves Pokémon mid-move alone', async () => {
        await arrive(1, { status: 'transferring' });
        await settleRanch(userId);
        assert.equal(await StoredPokemon.countDocuments({ penId: null }), 1);
    });

    it('is the same pen when two requests settle a new user at once', async () => {
        await Promise.all([settleRanch(userId), settleRanch(userId)]);
        assert.equal(await RanchPen.countDocuments({ userId: USER }), 1);
    });
});

describe('addPen', () => {
    it('names a new pen after the first free number', async () => {
        const pens = await settleRanch(userId);
        pens.push(await addPen(userId, pens, 'Lake'));
        pens.push(await addPen(userId, pens));
        assert.deepEqual(pens.map(p => p.name), ['Pen 1', 'Lake', 'Pen 2']);
        assert.deepEqual(pens.map(p => p.order), [0, 1, 2]);
    });
});

describe('corral field', () => {
    it('spreads Pokémon only over the ground, the same way for the same seed', () => {
        const a = spreadSpots(CORRAL, PEN_CAPACITY, seededRandom('pen'));
        const b = spreadSpots(CORRAL, PEN_CAPACITY, seededRandom('pen'));
        assert.deepEqual(a, b);
        assert.ok(a.every(s => onGround(CORRAL, s)));
    });

    it('draws Pokémon smaller further back', () => {
        assert.equal(depthScale(CORRAL, CORRAL.front), 1);
        assert.equal(depthScale(CORRAL, CORRAL.horizon), CORRAL.farScale);
    });
});
