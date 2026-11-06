import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import StoredPokemon from '@/models/StoredPokemon';
import { TextEncoder as Gen1Text, encodeNameString } from '@/utils/sramParser';
import { clearSlot, hasTrainerId, injectPokemon, stampTrainerId } from '@/utils/sramWriter';
import { extractFromSRAM } from './extract';
import {
    BOX_MIRROR_BASE,
    DAYCARE_IN_USE,
    DAYCARE_MON,
    PARTY_BASE,
    PARTY_DATA,
    PARTY_NICK,
    PARTY_OT,
    PARTY_SPECIES,
    PLAYER_ID,
    PLAYER_NAME,
    SRAM_SIZE,
    boxBankedBase,
    isBoxAvailable,
    readSaveContents,
    validateGen1Save,
    writeMainChecksum,
} from './gen1Save';

const CURRENT_BOX_NUM = 0x284C;
const OT_ID = 0x0C;
const NEW_ID = 0xBEEF;

function mon(species: number, level: number): number[] {
    const m = new Array(44).fill(0);
    m[0x00] = species;
    m[0x02] = 20;       // current HP
    m[0x03] = level;
    m[0x04] = 8;        // poisoned
    m[0x0C] = 0x12;     // OT ID
    m[0x0D] = 0x34;
    m[0x21] = level;
    return m;
}

function writeName(sram: Uint8Array, offset: number, bytes: number[]) {
    sram.fill(0x50, offset, offset + 11);
    sram.set(bytes, offset);
}

const RED = [0x91, 0x84, 0x83];

// A save shaped like a real one from the emulator: three in the party, no boxes used,
// and banks 2 and 3 never set up. Pass `boxesSetUp` for a player who has changed boxes.
function makeSave({ boxesSetUp = false } = {}): Uint8Array {
    const sram = new Uint8Array(SRAM_SIZE);
    writeName(sram, PLAYER_NAME, RED);
    sram[PLAYER_ID] = 0x12;
    sram[PLAYER_ID + 1] = 0x34;

    const party = [[0x99, 12, [0x80]], [0x54, 30, [0x81]], [0xB0, 9, [0x82]]] as const;
    sram[PARTY_BASE] = party.length;
    party.forEach(([species, level, nick], i) => {
        sram[PARTY_SPECIES + i] = species;
        sram.set(mon(species, level), PARTY_DATA + i * 44);
        writeName(sram, PARTY_OT + i * 11, RED);
        writeName(sram, PARTY_NICK + i * 11, [...nick]);
    });
    sram[PARTY_SPECIES + party.length] = 0xFF;

    sram[BOX_MIRROR_BASE + 1] = 0xFF;
    if (boxesSetUp) {
        sram[CURRENT_BOX_NUM] = 0x80;
        for (let b = 1; b <= 12; b++) sram[boxBankedBase(b) + 1] = 0xFF;
    }
    writeMainChecksum(sram);
    return sram;
}

const NAMES = { nickname: encodeNameString('A'), otName: encodeNameString('RED') };

describe('validateGen1Save', () => {
    it('accepts a real-shaped save, including one saved before the starter', () => {
        assert.equal(validateGen1Save(makeSave()), null);

        const noStarter = makeSave();
        noStarter[PARTY_BASE] = 0;
        noStarter[PARTY_SPECIES] = 0xFF;
        writeMainChecksum(noStarter);
        assert.equal(validateGen1Save(noStarter), null);
    });

    it('rejects a blank save, whatever it is filled with', () => {
        assert.match(validateGen1Save(new Uint8Array(SRAM_SIZE))!, /no valid in-game save/);
        assert.match(validateGen1Save(new Uint8Array(SRAM_SIZE).fill(0xFF))!, /no valid in-game save/);
    });

    it('rejects a file of the wrong size', () => {
        assert.match(validateGen1Save(new Uint8Array(0x2000))!, /Gen 1/);
    });

    it('rejects other data even when the checksum happens to pass', () => {
        const noisy = () => {
            let x = 1234567;
            const sram = new Uint8Array(SRAM_SIZE).map(() => (x = (x * 1103515245 + 12345) & 0x7fffffff) & 0xFF);
            writeMainChecksum(sram);
            return sram;
        };
        assert.match(validateGen1Save(noisy())!, /Gen 1/);

        const badParty = makeSave();
        badParty[PARTY_BASE] = 7;
        writeMainChecksum(badParty);
        assert.match(validateGen1Save(badParty)!, /Gen 1/);

        const noTerminator = makeSave();
        noTerminator[PARTY_SPECIES + 3] = 0x99;
        writeMainChecksum(noTerminator);
        assert.match(validateGen1Save(noTerminator)!, /Gen 1/);
    });

    it('still passes after every kind of write', () => {
        let sram = stampTrainerId(makeSave(), NEW_ID);
        assert.equal(validateGen1Save(sram), null);
        const taken = extractFromSRAM(sram, { location: 'party', slotIndex: 0 });
        sram = clearSlot(sram, { location: 'party', slotIndex: 0 });
        assert.equal(validateGen1Save(sram), null);
        sram = injectPokemon(sram, taken.rawBoxData, NAMES, NEW_ID, { location: 'box', boxNumber: 1, slotIndex: 0 });
        assert.equal(validateGen1Save(sram), null);
        sram = injectPokemon(sram, Buffer.from(taken.rawBoxData), NAMES, NEW_ID, { location: 'party', slotIndex: 0 });
        assert.equal(validateGen1Save(sram), null);
    });
});

describe('names', () => {
    // Every byte a player can enter on the naming screen, plus in-game trades.
    const NAMING_SCREEN = [
        ...Array.from({ length: 26 }, (_, i) => 0x80 + i),
        ...Array.from({ length: 26 }, (_, i) => 0xA0 + i),
        0x7F, 0xF1, 0x9A, 0x9B, 0x9C, 0x9D, 0x9E, 0x9F, 0xE1, 0xE2, 0xE3, 0xE6, 0xE7, 0xEF, 0xF5, 0xF3, 0xF2, 0xF4,
    ];

    it('decodes and re-encodes every naming-screen byte', () => {
        for (const byte of NAMING_SCREEN) {
            const decoded = Gen1Text.decodeString([byte, 0x50]);
            assert.notEqual(decoded, '', `0x${byte.toString(16)} decoded to nothing`);
            assert.deepEqual(Gen1Text.encodeString(decoded), [byte, 0x50], `0x${byte.toString(16)} (${decoded})`);
        }
    });

    it('keeps apostrophes and contractions', () => {
        const farfetchd = [0x85, 0x80, 0x91, 0x85, 0x84, 0x93, 0x82, 0x87, 0xE0, 0x83, 0x50];
        assert.equal(Gen1Text.decodeString(farfetchd), "FARFETCH'D");
        assert.deepEqual(Gen1Text.encodeString("FARFETCH'D"), farfetchd);
        assert.deepEqual(Gen1Text.encodeString("A'dB"), [0x80, 0xBB, 0x81, 0x50]);
    });

    it("doesn't turn plain letters into glyphs", () => {
        assert.deepEqual(Gen1Text.encodeString('SPK'), [0x92, 0x8F, 0x8A, 0x50]);
        assert.deepEqual(Gen1Text.encodeString('TRAINER'), [0x93, 0x91, 0x80, 0x88, 0x8D, 0x84, 0x91, 0x50]);
    });

    it('carries the exact name bytes from one save to another', () => {
        const source = stampTrainerId(makeSave(), NEW_ID);
        // MR.MIME uses the 0xE8 dot, which a string can't tell apart from 0xF2, and
        // in-game trades have <TRAINER> as their OT.
        const nickname = [0x8C, 0x91, 0xE8, 0x8C, 0x88, 0x8C, 0x84];
        writeName(source, PARTY_NICK, nickname);
        writeName(source, PARTY_OT, [0x5D]);

        const taken = extractFromSRAM(source, { location: 'party', slotIndex: 0 });
        assert.equal(taken.nickname, 'MR.MIME');
        assert.equal(taken.otName, 'TRAINER');

        const target = injectPokemon(
            makeSave(), taken.rawBoxData, { nickname: taken.nicknameBytes, otName: taken.otNameBytes },
            NEW_ID, { location: 'party', slotIndex: 0 },
        );
        const paddedNick = [...nickname, 0x50, 0x50, 0x50, 0x50];
        assert.deepEqual(Array.from(target.subarray(PARTY_NICK + 3 * 11, PARTY_NICK + 4 * 11)), paddedNick);
        assert.equal(target[PARTY_OT + 3 * 11], 0x5D);
    });

    it('stores a Pokémon whose names decode to nothing', async () => {
        const id = new mongoose.Types.ObjectId();
        const stored = new StoredPokemon({
            userId: id, sourceGameId: id, generation: 1, sourceSlot: { location: 'party', slotIndex: 0 },
            speciesIndex: 0x99, speciesName: 'x', nickname: '', otName: '', otId: 1, level: 5,
            rawBoxData: Buffer.alloc(33), extractedAt: new Date(),
        });
        await stored.validate();
    });

    it('shows the species when a nickname decodes to nothing', () => {
        const sram = makeSave();
        writeName(sram, PARTY_NICK, [0x01]);
        const taken = extractFromSRAM(sram, { location: 'party', slotIndex: 0 });
        assert.equal(taken.nickname, taken.speciesName.toUpperCase());
    });
});

describe('boxes the game has not set up', () => {
    it('only offers the current box until the player changes boxes', () => {
        const fresh = readSaveContents(makeSave());
        assert.deepEqual(fresh.boxAvailable, [true, ...new Array(11).fill(false)]);

        const used = readSaveContents(makeSave({ boxesSetUp: true }));
        assert.deepEqual(used.boxAvailable, new Array(12).fill(true));
    });

    it('ignores leftover bytes in those boxes', () => {
        const sram = makeSave();
        const box5 = boxBankedBase(5);
        sram[box5] = 1;
        sram[box5 + 1] = 0x99;
        sram[box5 + 22 + 3] = 10;
        assert.equal(isBoxAvailable(sram, 5), false);
        assert.deepEqual(readSaveContents(sram).boxes[4], []);

        const used = makeSave({ boxesSetUp: true });
        used[box5] = 1;
        used[box5 + 1] = 0x99;
        used[box5 + 2] = 0xFF;
        used[box5 + 22 + 3] = 10;
        assert.equal(readSaveContents(used).boxes[4].length, 1);
    });

    it("doesn't stamp them", () => {
        const sram = makeSave();
        const box5Mon = boxBankedBase(5) + 22;
        sram[boxBankedBase(5)] = 1;
        sram[box5Mon] = 0x99;
        const stamped = stampTrainerId(sram, NEW_ID);
        assert.equal(stamped[box5Mon + OT_ID], 0);
    });
});

describe('stampTrainerId', () => {
    it('stamps the player, party, boxes and Day Care, and leaves a valid checksum', () => {
        const sram = makeSave({ boxesSetUp: true });
        const mirrorMon = BOX_MIRROR_BASE + 22;
        sram[BOX_MIRROR_BASE] = 1;
        sram[BOX_MIRROR_BASE + 1] = 0x99;
        sram[BOX_MIRROR_BASE + 2] = 0xFF;
        sram.set(mon(0x99, 5).slice(0, 33), mirrorMon);
        sram[DAYCARE_IN_USE] = 1;
        sram.set(mon(0x54, 20).slice(0, 33), DAYCARE_MON);
        writeMainChecksum(sram);

        const out = stampTrainerId(sram, NEW_ID);
        const be = (o: number) => (out[o] << 8) | out[o + 1];
        assert.ok(hasTrainerId(out, NEW_ID));
        assert.equal(be(PARTY_DATA + OT_ID), NEW_ID);
        assert.equal(be(mirrorMon + OT_ID), NEW_ID);
        assert.equal(be(DAYCARE_MON + OT_ID), NEW_ID);
        assert.equal(validateGen1Save(out), null);
    });

    it('leaves an empty Day Care alone', () => {
        const out = stampTrainerId(makeSave(), NEW_ID);
        assert.equal(out[DAYCARE_MON + OT_ID], 0);
    });
});

describe('moving a Pokémon', () => {
    it('survives party → Ranch → box → Ranch → party with only HP and status changing', () => {
        let sram = stampTrainerId(makeSave({ boxesSetUp: true }), NEW_ID);
        const first = extractFromSRAM(sram, { location: 'party', slotIndex: 0 });
        sram = clearSlot(sram, { location: 'party', slotIndex: 0 });
        assert.equal(sram[PARTY_BASE], 2);
        assert.equal(sram[PARTY_SPECIES], 0x54);

        const original = Buffer.from(first.rawBoxData);
        const names = { nickname: first.nicknameBytes, otName: first.otNameBytes };
        sram = injectPokemon(sram, first.rawBoxData, names, NEW_ID, { location: 'box', boxNumber: 3, slotIndex: 0 });
        const inBox = extractFromSRAM(sram, { location: 'box', boxNumber: 3, slotIndex: 0 });
        sram = clearSlot(sram, { location: 'box', boxNumber: 3, slotIndex: 0 });
        sram = injectPokemon(sram, inBox.rawBoxData, names, NEW_ID, { location: 'party', slotIndex: 0 });
        const back = extractFromSRAM(sram, { location: 'party', slotIndex: 2 });

        const changed = [...original.keys()].filter(i => original[i] !== back.rawBoxData[i]);
        assert.ok(changed.every(i => [0x01, 0x02, 0x04].includes(i)), `changed: ${changed}`);
        assert.equal(back.level, 12);
        assert.equal(validateGen1Save(sram), null);
    });
});
