import { SRAMParser, TextEncoder } from '@/utils/sramParser';
import { calcGen1Stats } from '@/utils/pokemon/stats';

export interface WriteSlot {
    location: 'party' | 'box';
    boxNumber?: number;
    slotIndex: number;
}

// Offsets relative to party base (0x2F2C)
const PARTY_BASE = 0x2F2C;
const PARTY_COUNT = PARTY_BASE;
const PARTY_SPECIES = PARTY_BASE + 1;      // 6 bytes + 1 terminator + 1 padding = 8 before data
const PARTY_DATA = PARTY_BASE + 8;         // 44 bytes per slot
const PARTY_OT = PARTY_BASE + 8 + 6 * 44;
const PARTY_NICK = PARTY_BASE + 8 + 6 * 44 + 6 * 11;

// Current box (mirror) at 0x30C0
const BOX_MIRROR_BASE = 0x30C0;

// PC box layout
const BOX_SIZE = 0x462;

function boxBase(boxNumber: number): number {
    const bankBase = boxNumber <= 6 ? 0x4000 : 0x6000;
    const idx = boxNumber <= 6 ? boxNumber - 1 : boxNumber - 7;
    return bankBase + idx * BOX_SIZE;
}

const BOX_DATA_OFFSET = 22;
const BOX_OT_OFFSET = 22 + 20 * 33;
const BOX_NICK_OFFSET = 22 + 20 * 33 + 20 * 11;

export function clearSlot(sramData: Uint8Array, slot: WriteSlot): Uint8Array {
    const sram = new Uint8Array(sramData);

    if (slot.location === 'party') {
        clearPartySlot(sram, slot.slotIndex);
    } else {
        clearBoxSlot(sram, slot.boxNumber!, slot.slotIndex);
    }

    const parser = new SRAMParser(Array.from(sram));
    sram[0x3523] = parser.calculateMainDataChecksum();
    return sram;
}

function clearPartySlot(sram: Uint8Array, slotIndex: number): void {
    const count = sram[PARTY_COUNT];
    if (slotIndex >= count) return;

    // Zero the 44-byte pokemon data
    const dataStart = PARTY_DATA + slotIndex * 44;
    sram.fill(0, dataStart, dataStart + 44);

    // Shift remaining slots left in species list (bytes 1–6, positions 0–5)
    for (let i = slotIndex; i < count - 1; i++) {
        sram[PARTY_SPECIES + i] = sram[PARTY_SPECIES + i + 1];
    }
    sram[PARTY_SPECIES + count - 1] = 0xFF;

    // Shift OT and nickname arrays
    shiftNames(sram, PARTY_OT, slotIndex, count, 6);
    shiftNames(sram, PARTY_NICK, slotIndex, count, 6);

    // Shift pokemon data blocks
    for (let i = slotIndex; i < count - 1; i++) {
        const src = PARTY_DATA + (i + 1) * 44;
        const dst = PARTY_DATA + i * 44;
        sram.copyWithin(dst, src, src + 44);
    }
    sram.fill(0, PARTY_DATA + (count - 1) * 44, PARTY_DATA + count * 44);

    sram[PARTY_COUNT] = count - 1;
}

function clearBoxSlot(sram: Uint8Array, boxNumber: number, slotIndex: number): void {
    const base = boxBase(boxNumber);
    const count = sram[base];
    if (slotIndex >= count) return;

    const dataStart = base + BOX_DATA_OFFSET + slotIndex * 33;
    sram.fill(0, dataStart, dataStart + 33);

    // Shift species list (starts at base + 1, up to 20 entries + 0xFF terminator)
    for (let i = slotIndex; i < count - 1; i++) {
        sram[base + 1 + i] = sram[base + 1 + i + 1];
    }
    sram[base + 1 + count - 1] = 0xFF;

    // Shift pokemon data blocks
    for (let i = slotIndex; i < count - 1; i++) {
        const src = base + BOX_DATA_OFFSET + (i + 1) * 33;
        const dst = base + BOX_DATA_OFFSET + i * 33;
        sram.copyWithin(dst, src, src + 33);
    }
    sram.fill(0, base + BOX_DATA_OFFSET + (count - 1) * 33, base + BOX_DATA_OFFSET + count * 33);

    shiftNames(sram, base + BOX_OT_OFFSET, slotIndex, count, 20);
    shiftNames(sram, base + BOX_NICK_OFFSET, slotIndex, count, 20);

    sram[base] = count - 1;
}

export function injectPokemon(
    sramData: Uint8Array,
    rawBoxData: Buffer,
    nickname: string,
    otName: string,
    appTrainerId: number,
    targetSlot: WriteSlot
): Uint8Array {
    const sram = new Uint8Array(sramData);

    // Overwrite OT ID (big-endian at 0x0C–0x0D)
    rawBoxData[0x0C] = (appTrainerId >> 8) & 0xFF;
    rawBoxData[0x0D] = appTrainerId & 0xFF;

    // Heal: clear status byte, set current HP to maxHP
    rawBoxData[0x04] = 0x00;
    const stats = calcGen1Stats(rawBoxData);
    rawBoxData[0x01] = (stats.maxHP >> 8) & 0xFF;
    rawBoxData[0x02] = stats.maxHP & 0xFF;

    if (targetSlot.location === 'party') {
        injectParty(sram, rawBoxData, nickname, otName, stats, targetSlot.slotIndex);
    } else {
        injectBox(sram, rawBoxData, nickname, otName, targetSlot.boxNumber!, targetSlot.slotIndex);
    }

    const parser = new SRAMParser(Array.from(sram));
    sram[0x3523] = parser.calculateMainDataChecksum();
    return sram;
}

function injectParty(
    sram: Uint8Array,
    rawBoxData: Buffer,
    nickname: string,
    otName: string,
    stats: ReturnType<typeof calcGen1Stats>,
    slotIndex: number
): void {
    const count = sram[PARTY_COUNT];
    if (count >= 6) throw new Error('Party is full');

    const speciesIndex = rawBoxData[0x00];
    const level = rawBoxData[0x03];

    // Species list
    sram[PARTY_SPECIES + slotIndex] = speciesIndex;
    sram[PARTY_SPECIES + count] = 0xFF; // terminator

    // Build 44-byte party form
    const partyBytes = new Uint8Array(44);
    partyBytes.set(rawBoxData.slice(0, 33), 0);
    partyBytes[0x21] = level;
    writeUint16BE(partyBytes, 0x22, stats.maxHP);
    writeUint16BE(partyBytes, 0x24, stats.attack);
    writeUint16BE(partyBytes, 0x26, stats.defense);
    writeUint16BE(partyBytes, 0x28, stats.speed);
    writeUint16BE(partyBytes, 0x2A, stats.special);

    const dataStart = PARTY_DATA + slotIndex * 44;
    sram.set(partyBytes, dataStart);

    writeNameAt(sram, PARTY_OT + slotIndex * 11, otName);
    writeNameAt(sram, PARTY_NICK + slotIndex * 11, nickname);

    sram[PARTY_COUNT] = count + 1;
}

function injectBox(
    sram: Uint8Array,
    rawBoxData: Buffer,
    nickname: string,
    otName: string,
    boxNumber: number,
    slotIndex: number
): void {
    const base = boxBase(boxNumber);
    const count = sram[base];
    if (count >= 20) throw new Error('Box is full');

    const speciesIndex = rawBoxData[0x00];

    sram[base + 1 + slotIndex] = speciesIndex;
    sram[base + 1 + count] = 0xFF;

    const dataStart = base + BOX_DATA_OFFSET + slotIndex * 33;
    sram.set(rawBoxData.slice(0, 33), dataStart);

    writeNameAt(sram, base + BOX_OT_OFFSET + slotIndex * 11, otName);
    writeNameAt(sram, base + BOX_NICK_OFFSET + slotIndex * 11, nickname);

    sram[base] = count + 1;
}

function shiftNames(sram: Uint8Array, base: number, from: number, count: number, _max: number): void {
    for (let i = from; i < count - 1; i++) {
        sram.copyWithin(base + i * 11, base + (i + 1) * 11, base + (i + 1) * 11 + 11);
    }
    sram.fill(0x50, base + (count - 1) * 11, base + count * 11);
}

function writeNameAt(sram: Uint8Array, offset: number, name: string): void {
    const encoded = TextEncoder.encodeString(name);
    for (let i = 0; i < 11; i++) {
        sram[offset + i] = encoded[i] ?? 0x50;
    }
}

function writeUint16BE(buf: Uint8Array, offset: number, value: number): void {
    buf[offset] = (value >> 8) & 0xFF;
    buf[offset + 1] = value & 0xFF;
}
