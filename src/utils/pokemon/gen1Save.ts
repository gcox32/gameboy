/*
 * Gen 1 save file layout. Everything that reads or writes a save goes through here,
 * so callers ask for a slot rather than computing offsets. Safe on server and client.
 *
 * MBCRam is a flat 32 KB array of four 8 KB SRAM banks:
 *   Bank 0  0x0000–0x1FFF  sprite tiles, Hall of Fame
 *   Bank 1  0x2000–0x3FFF  main save data, party, current box
 *   Bank 2  0x4000–0x5FFF  PC boxes 1–6
 *   Bank 3  0x6000–0x7FFF  PC boxes 7–12
 *
 * Party (0x2F2C):
 *   [0]        count (0–6). 0 is legal: the game can save before the starter.
 *   [1–7]      species list + 0xFF terminator
 *   [8 + i*44] 44-byte Pokémon data; the first 33 bytes are the box form
 *   then 6 × 11-byte OT names, then 6 × 11-byte nicknames
 *
 * PC box (0x462 bytes each):
 *   [0]         count (0–20)
 *   [1–21]      species list + 0xFF terminator
 *   [22 + i*33] 33-byte Pokémon data
 *   then 20 × 11-byte OT names, then 20 × 11-byte nicknames
 *
 * Current box: the game works on a copy at 0x30C0 and only reads or writes a box's
 * banked slot when the player changes boxes, so the banked slot is stale while current.
 *
 * wCurrentBoxNum (0x284C): low bits = 0-indexed current box. Bit 7 = the player has
 * changed boxes at least once. Until then banks 2 and 3 have never been set up, and the
 * first change wipes all of them (ChangeBox → EmptyAllSRAMBoxes), so only the current
 * box can hold anything.
 */

import { TextEncoder as Gen1Text } from '@/utils/sramParser';
import { dexDict } from './dicts';
import { Gen1IVs, decodeIVs } from './stats';

export const SRAM_SIZE = 0x8000;
export const NAME_LENGTH = 11;
export const BOX_MON_SIZE = 33;
export const PARTY_MON_SIZE = 44;
export const PARTY_CAPACITY = 6;
export const BOX_CAPACITY = 20;
export const BOX_COUNT = 12;

const NAME_TERMINATOR = 0x50;
const LIST_TERMINATOR = 0xFF;

// Main data covered by the game's checksum (sPlayerName through sMainDataCheckSum - 1)
const MAIN_DATA_START = 0x2598;
const MAIN_DATA_CHECKSUM = 0x3523;

export const PLAYER_NAME = 0x2598;
export const PLAYER_ID = 0x2605;
const CURRENT_BOX_NUM = 0x284C;
export const DAYCARE_IN_USE = 0x2CF4;
export const DAYCARE_MON = 0x2D0B;     // box form

export const PARTY_BASE = 0x2F2C;
export const PARTY_SPECIES = PARTY_BASE + 1;
export const PARTY_DATA = PARTY_BASE + 8;
export const PARTY_OT = PARTY_DATA + PARTY_CAPACITY * PARTY_MON_SIZE;
export const PARTY_NICK = PARTY_OT + PARTY_CAPACITY * NAME_LENGTH;

export const BOX_MIRROR_BASE = 0x30C0;
export const BOX_SIZE = 0x462;
export const BOX_SPECIES_OFFSET = 1;
export const BOX_DATA_OFFSET = 22;
export const BOX_OT_OFFSET = BOX_DATA_OFFSET + BOX_CAPACITY * BOX_MON_SIZE;
export const BOX_NICK_OFFSET = BOX_OT_OFFSET + BOX_CAPACITY * NAME_LENGTH;

// ─── Slots ──────────────────────────────────────────────────────────────────

export interface SaveSlot {
    location: 'party' | 'box';
    boxNumber?: number; // 1–12, only for box
    slotIndex: number;  // 0–5 party, 0–19 box
}

export interface SlotLocation {
    dataOffset: number;
    dataSize: number;   // 44 in the party, 33 in a box
    otOffset: number;
    nicknameOffset: number;
}

// Validates an untrusted slot from a request body.
export function isValidSlot(slot: unknown): slot is SaveSlot {
    if (!slot || typeof slot !== 'object') return false;
    const { location, boxNumber, slotIndex } = slot as Record<string, unknown>;
    if (location === 'party') {
        return Number.isInteger(slotIndex) && (slotIndex as number) >= 0 && (slotIndex as number) < PARTY_CAPACITY;
    }
    if (location === 'box') {
        return Number.isInteger(boxNumber) && (boxNumber as number) >= 1 && (boxNumber as number) <= BOX_COUNT
            && Number.isInteger(slotIndex) && (slotIndex as number) >= 0 && (slotIndex as number) < BOX_CAPACITY;
    }
    return false;
}

export function currentBoxIndex(sram: Uint8Array): number {
    return sram[CURRENT_BOX_NUM] & 0x7F;
}

export function boxesInitialized(sram: Uint8Array): boolean {
    return (sram[CURRENT_BOX_NUM] & 0x80) !== 0;
}

// Whether the game will keep what's in this box. See the wCurrentBoxNum note above.
export function isBoxAvailable(sram: Uint8Array, boxNumber: number): boolean {
    return boxesInitialized(sram) || boxNumber - 1 === currentBoxIndex(sram);
}

export function isSlotAvailable(sram: Uint8Array, slot: SaveSlot): boolean {
    return slot.location === 'party' || isBoxAvailable(sram, slot.boxNumber!);
}

export const BOX_UNAVAILABLE_MESSAGE =
    "That PC box isn't set up yet. Change boxes once at a PC in the game, save, and try again.";

// Always the banked slot, even for the current box.
export function boxBankedBase(boxNumber: number): number {
    const bankBase = boxNumber <= 6 ? 0x4000 : 0x6000;
    const idx = boxNumber <= 6 ? boxNumber - 1 : boxNumber - 7;
    return bankBase + idx * BOX_SIZE;
}

// Where a box's live data is: the mirror for the current box, otherwise its banked slot.
export function boxBase(sram: Uint8Array, boxNumber: number): number {
    return boxNumber - 1 === currentBoxIndex(sram) ? BOX_MIRROR_BASE : boxBankedBase(boxNumber);
}

export function locateSlot(sram: Uint8Array, slot: SaveSlot): SlotLocation {
    const i = slot.slotIndex;
    if (slot.location === 'party') {
        return {
            dataOffset: PARTY_DATA + i * PARTY_MON_SIZE,
            dataSize: PARTY_MON_SIZE,
            otOffset: PARTY_OT + i * NAME_LENGTH,
            nicknameOffset: PARTY_NICK + i * NAME_LENGTH,
        };
    }
    const base = boxBase(sram, slot.boxNumber!);
    return {
        dataOffset: base + BOX_DATA_OFFSET + i * BOX_MON_SIZE,
        dataSize: BOX_MON_SIZE,
        otOffset: base + BOX_OT_OFFSET + i * NAME_LENGTH,
        nicknameOffset: base + BOX_NICK_OFFSET + i * NAME_LENGTH,
    };
}

export function isSlotOccupied(sram: Uint8Array, slot: SaveSlot): boolean {
    const count = slot.location === 'party' ? sram[PARTY_BASE] : sram[boxBase(sram, slot.boxNumber!)];
    return slot.slotIndex < count;
}

// ─── Checksum ───────────────────────────────────────────────────────────────

export function calcMainChecksum(sram: ArrayLike<number>): number {
    let sum = 0;
    for (let i = MAIN_DATA_START; i < MAIN_DATA_CHECKSUM; i++) sum += sram[i];
    return ~sum & 0xFF;
}

export function writeMainChecksum(sram: Uint8Array): void {
    sram[MAIN_DATA_CHECKSUM] = calcMainChecksum(sram);
}

// ─── Validation ─────────────────────────────────────────────────────────────

/**
 * Returns why this can't be treated as a Gen 1 save, or null if it can.
 *
 * Writers recompute the checksum, so anything they touch looks valid to the game
 * afterwards. Run this before any write or a blank save, or another game's, gets
 * turned into a "valid" Pokémon save that can't be undone.
 */
export function validateGen1Save(sram: Uint8Array): string | null {
    const NOT_GEN1 = "This doesn't look like a Gen 1 Pokémon save file.";

    if (sram.length !== SRAM_SIZE) return NOT_GEN1;

    if (sram[MAIN_DATA_CHECKSUM] !== calcMainChecksum(sram)) {
        return "This file has no valid in-game save. Save from the game's menu, then try again.";
    }

    // One byte of checksum passes by chance 1 time in 256, so check the structure too.
    const name = Array.from(sram.subarray(PLAYER_NAME, PLAYER_NAME + NAME_LENGTH));
    if (name.indexOf(NAME_TERMINATOR) < 1) return NOT_GEN1;

    const partyCount = sram[PARTY_BASE];
    if (partyCount > PARTY_CAPACITY || sram[PARTY_SPECIES + partyCount] !== LIST_TERMINATOR) return NOT_GEN1;

    if (currentBoxIndex(sram) >= BOX_COUNT) return NOT_GEN1;

    const boxCount = sram[BOX_MIRROR_BASE];
    if (boxCount > BOX_CAPACITY || sram[BOX_MIRROR_BASE + BOX_SPECIES_OFFSET + boxCount] !== LIST_TERMINATOR) return NOT_GEN1;

    return null;
}

// ─── Reading for display ────────────────────────────────────────────────────

export interface SlotPokemon extends SaveSlot {
    speciesIndex: number;
    nickname: string;
    level: number;
    ivs: Gen1IVs;
}

export interface SaveContents {
    party: SlotPokemon[];
    boxes: SlotPokemon[][];     // always BOX_COUNT long
    boxAvailable: boolean[];    // always BOX_COUNT long
}

function readIVs(sram: Uint8Array, dataOffset: number): Gen1IVs {
    return decodeIVs(sram.subarray(dataOffset, dataOffset + BOX_MON_SIZE));
}

function readName(sram: Uint8Array, offset: number): string {
    return Gen1Text.decodeString(Array.from(sram.subarray(offset, offset + NAME_LENGTH)));
}

function readBox(sram: Uint8Array, boxNumber: number): SlotPokemon[] {
    const base = boxBase(sram, boxNumber);
    const count = sram[base];
    if (!count || count > BOX_CAPACITY) return [];

    const result: SlotPokemon[] = [];
    for (let i = 0; i < count; i++) {
        // The species list, not the data block, is the canonical occupancy indicator.
        const speciesIndex = sram[base + BOX_SPECIES_OFFSET + i];
        if (speciesIndex === LIST_TERMINATOR) break;
        if (!speciesIndex || !dexDict[speciesIndex]) continue;
        const slot: SaveSlot = { location: 'box', boxNumber, slotIndex: i };
        const { dataOffset, nicknameOffset } = locateSlot(sram, slot);
        const level = sram[dataOffset + 0x03];
        if (level < 2 || level > 100) continue;
        result.push({ ...slot, speciesIndex, nickname: readName(sram, nicknameOffset), level, ivs: readIVs(sram, dataOffset) });
    }
    return result;
}

export function readSaveContents(sram: Uint8Array): SaveContents {
    const party: SlotPokemon[] = [];
    for (let i = 0; i < Math.min(sram[PARTY_BASE], PARTY_CAPACITY); i++) {
        const slot: SaveSlot = { location: 'party', slotIndex: i };
        const { dataOffset, nicknameOffset } = locateSlot(sram, slot);
        const speciesIndex = sram[dataOffset];
        if (!speciesIndex || speciesIndex === LIST_TERMINATOR) continue;
        party.push({
            ...slot,
            speciesIndex,
            nickname: readName(sram, nicknameOffset),
            level: sram[dataOffset + 0x21],
            ivs: readIVs(sram, dataOffset),
        });
    }

    const boxes: SlotPokemon[][] = [];
    const boxAvailable: boolean[] = [];
    for (let b = 1; b <= BOX_COUNT; b++) {
        const available = isBoxAvailable(sram, b);
        boxAvailable.push(available);
        // An unavailable box holds leftover bytes, not Pokémon.
        boxes.push(available ? readBox(sram, b) : []);
    }

    return { party, boxes, boxAvailable };
}
