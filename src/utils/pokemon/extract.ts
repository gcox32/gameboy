import { SRAMParser, TextEncoder } from '@/utils/sramParser';
import { dexDict } from './dicts';

export interface SourceSlot {
    location: 'party' | 'box';
    boxNumber?: number; // 1–12, only for box
    slotIndex: number;  // 0–5 party, 0–19 box
}

export interface RawExtractedPokemon {
    rawBoxData: Buffer;  // 33 bytes
    nickname: string;
    otName: string;
    otId: number;
    speciesIndex: number;
    speciesName: string;
    level: number;
}

// Box layout constants
const BOX_COUNT_OFFSET = 0;
const BOX_SPECIES_OFFSET = 1;       // 20 bytes + 1 terminator + 1 padding = 22 bytes before data
const BOX_DATA_OFFSET = 22;         // 33 bytes × slot
const BOX_OT_OFFSET = 22 + 20 * 33;   // 11 bytes × slot
const BOX_NICK_OFFSET = 22 + 20 * 33 + 20 * 11; // 11 bytes × slot

// Party layout constants
const PARTY_COUNT_OFFSET = 0;
const PARTY_DATA_OFFSET = 8;        // 44 bytes × slot
const PARTY_OT_OFFSET = 8 + 6 * 44;
const PARTY_NICK_OFFSET = 8 + 6 * 44 + 6 * 11;

export function extractFromSRAM(sramData: Uint8Array, slot: SourceSlot): RawExtractedPokemon {
    const sram = Array.from(sramData);

    if (slot.location === 'party') {
        return extractFromParty(sram, slot.slotIndex);
    } else {
        return extractFromBox(sram, slot.boxNumber!, slot.slotIndex);
    }
}

function extractFromParty(sram: number[], slotIndex: number): RawExtractedPokemon {
    const partyBase = 0x2F2C;
    const count = sram[partyBase + PARTY_COUNT_OFFSET];
    if (slotIndex >= count) throw new Error(`Party slot ${slotIndex} is empty`);

    const dataStart = partyBase + PARTY_DATA_OFFSET + slotIndex * 44;
    const rawBoxData = Buffer.from(sram.slice(dataStart, dataStart + 33));

    // Byte 0x03 (box level) may be stale for party Pokémon that leveled up without
    // being deposited. The authoritative party level is at byte 0x21 of the 44-byte form.
    rawBoxData[0x03] = sram[dataStart + 0x21];

    const otStart = partyBase + PARTY_OT_OFFSET + slotIndex * 11;
    const nickStart = partyBase + PARTY_NICK_OFFSET + slotIndex * 11;

    return buildExtracted(rawBoxData, sram, otStart, nickStart, slotIndex);
}

function extractFromBox(sram: number[], boxNumber: number, slotIndex: number): RawExtractedPokemon {
    const BOX_SIZE = 0x462;
    const bankBase = boxNumber <= 6 ? 0x4000 : 0x6000;
    const boxIndex = boxNumber <= 6 ? boxNumber - 1 : boxNumber - 7;

    // Active box live data lives at 0x30C0, not in the banked slot (which is stale).
    // wCurrentBoxNum at 0x284C: bits 0–6 = 0-indexed box number; bit 7 = "has switched" flag.
    const currentBoxIdx = sram[0x284C] & 0x0F;
    const boxBase = (boxNumber - 1) === currentBoxIdx ? 0x30C0 : bankBase + boxIndex * BOX_SIZE;

    const count = sram[boxBase + BOX_COUNT_OFFSET];
    if (slotIndex >= count) throw new Error(`Box ${boxNumber} slot ${slotIndex} is empty`);

    const dataStart = boxBase + BOX_DATA_OFFSET + slotIndex * 33;
    const rawBoxData = Buffer.from(sram.slice(dataStart, dataStart + 33));

    const otStart = boxBase + BOX_OT_OFFSET + slotIndex * 11;
    const nickStart = boxBase + BOX_NICK_OFFSET + slotIndex * 11;

    return buildExtracted(rawBoxData, sram, otStart, nickStart, slotIndex);
}

function buildExtracted(
    rawBoxData: Buffer,
    sram: number[],
    otStart: number,
    nickStart: number,
    _slotIndex: number
): RawExtractedPokemon {
    const speciesIndex = rawBoxData[0x00];
    const level = rawBoxData[0x03];
    const otId = (rawBoxData[0x0C] << 8) | rawBoxData[0x0D];

    const otBytes = sram.slice(otStart, otStart + 11);
    const nickBytes = sram.slice(nickStart, nickStart + 11);

    const otName = TextEncoder.decodeString(otBytes);
    const nickname = TextEncoder.decodeString(nickBytes);

    const entry = dexDict[speciesIndex];
    const speciesName = entry?.name ?? 'unknown';

    return { rawBoxData, nickname, otName, otId, speciesIndex, speciesName, level };
}
