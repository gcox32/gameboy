import { calcGen1Stats } from '@/utils/pokemon/stats';
import {
    BOX_CAPACITY,
    BOX_COUNT,
    BOX_DATA_OFFSET,
    BOX_MIRROR_BASE,
    BOX_MON_SIZE,
    BOX_NICK_OFFSET,
    BOX_OT_OFFSET,
    BOX_SIZE,
    BOX_SPECIES_OFFSET,
    DAYCARE_IN_USE,
    DAYCARE_MON,
    NAME_LENGTH,
    PARTY_BASE,
    PARTY_CAPACITY,
    PARTY_DATA,
    PARTY_MON_SIZE,
    PARTY_NICK,
    PARTY_OT,
    PARTY_SPECIES,
    PLAYER_ID,
    SaveSlot,
    boxBankedBase,
    boxBase,
    currentBoxIndex,
    isBoxAvailable,
    writeMainChecksum,
} from '@/utils/pokemon/gen1Save';

// Stored name bytes, written back exactly as they were read.
export interface PokemonNames {
    nickname: ArrayLike<number>;
    otName: ArrayLike<number>;
}

// Keep the current box's banked slot matching its mirror after a write. The game
// overwrites that slot when the player changes boxes, so this isn't needed for the game
// itself, but it stops the file holding two different versions of the same box.
function syncCurrentBoxToBanked(sram: Uint8Array, boxNumber: number): void {
    if (boxNumber - 1 !== currentBoxIndex(sram)) return;
    sram.copyWithin(boxBankedBase(boxNumber), BOX_MIRROR_BASE, BOX_MIRROR_BASE + BOX_SIZE);
}

// True if the save's Player ID already equals appTrainerId (big-endian).
export function hasTrainerId(sram: Uint8Array, appTrainerId: number): boolean {
    return sram[PLAYER_ID] === ((appTrainerId >> 8) & 0xFF) && sram[PLAYER_ID + 1] === (appTrainerId & 0xFF);
}

// Stamps appTrainerId into the Player ID field and all existing Pokémon OT IDs.
// Called on Connect so every Pokémon in the save is owned by the app trainer,
// matching the Player ID that will be stamped on all future catches.
export function stampTrainerId(sramData: Uint8Array, appTrainerId: number): Uint8Array {
    const sram = new Uint8Array(sramData);

    const hiId = (appTrainerId >> 8) & 0xFF;
    const loId = appTrainerId & 0xFF;

    // Player ID at 0x2605–0x2606, big-endian. The game compares wPlayerID byte-for-byte
    // against a mon's OT ID (also big-endian), so both must use the same byte order.
    sram[PLAYER_ID] = hiId;
    sram[PLAYER_ID + 1] = loId;

    // Party: OT ID at data+0x0C–0x0D (big-endian), 44-byte slots
    const partyCount = Math.min(sram[PARTY_BASE], PARTY_CAPACITY);
    for (let i = 0; i < partyCount; i++) {
        const base = PARTY_DATA + i * PARTY_MON_SIZE;
        if (!sram[base]) continue;
        sram[base + 0x0C] = hiId;
        sram[base + 0x0D] = loId;
    }

    // Day Care: one box-form mon, withdrawn later with the same OT ID check
    if (sram[DAYCARE_IN_USE]) {
        sram[DAYCARE_MON + 0x0C] = hiId;
        sram[DAYCARE_MON + 0x0D] = loId;
    }

    // Boxes the game has set up: OT ID at data+0x0C–0x0D (big-endian), 33-byte slots
    for (let boxNumber = 1; boxNumber <= BOX_COUNT; boxNumber++) {
        if (!isBoxAvailable(sram, boxNumber)) continue;
        const base = boxBase(sram, boxNumber);
        const count = Math.min(sram[base], BOX_CAPACITY);
        for (let i = 0; i < count; i++) {
            const dataBase = base + BOX_DATA_OFFSET + i * BOX_MON_SIZE;
            if (!sram[dataBase]) continue;
            sram[dataBase + 0x0C] = hiId;
            sram[dataBase + 0x0D] = loId;
        }
        syncCurrentBoxToBanked(sram, boxNumber);
    }

    writeMainChecksum(sram);
    return sram;
}

export function clearSlot(sramData: Uint8Array, slot: SaveSlot): Uint8Array {
    const sram = new Uint8Array(sramData);

    if (slot.location === 'party') {
        clearPartySlot(sram, slot.slotIndex);
    } else {
        clearBoxSlot(sram, slot.boxNumber!, slot.slotIndex);
    }

    writeMainChecksum(sram);
    return sram;
}

function clearPartySlot(sram: Uint8Array, slotIndex: number): void {
    const count = sram[PARTY_BASE];
    if (slotIndex >= count) return;

    // Zero the 44-byte pokemon data
    const dataStart = PARTY_DATA + slotIndex * PARTY_MON_SIZE;
    sram.fill(0, dataStart, dataStart + PARTY_MON_SIZE);

    // Shift remaining slots left in species list (bytes 1–6, positions 0–5)
    for (let i = slotIndex; i < count - 1; i++) {
        sram[PARTY_SPECIES + i] = sram[PARTY_SPECIES + i + 1];
    }
    sram[PARTY_SPECIES + count - 1] = 0xFF;

    // Shift OT and nickname arrays
    shiftNames(sram, PARTY_OT, slotIndex, count);
    shiftNames(sram, PARTY_NICK, slotIndex, count);

    // Shift pokemon data blocks
    for (let i = slotIndex; i < count - 1; i++) {
        const src = PARTY_DATA + (i + 1) * PARTY_MON_SIZE;
        const dst = PARTY_DATA + i * PARTY_MON_SIZE;
        sram.copyWithin(dst, src, src + PARTY_MON_SIZE);
    }
    sram.fill(0, PARTY_DATA + (count - 1) * PARTY_MON_SIZE, PARTY_DATA + count * PARTY_MON_SIZE);

    sram[PARTY_BASE] = count - 1;
}

function clearBoxSlot(sram: Uint8Array, boxNumber: number, slotIndex: number): void {
    const base = boxBase(sram, boxNumber);
    const count = sram[base];
    if (slotIndex >= count) return;

    const dataStart = base + BOX_DATA_OFFSET + slotIndex * BOX_MON_SIZE;
    sram.fill(0, dataStart, dataStart + BOX_MON_SIZE);

    // Shift species list (up to 20 entries + 0xFF terminator)
    const species = base + BOX_SPECIES_OFFSET;
    for (let i = slotIndex; i < count - 1; i++) {
        sram[species + i] = sram[species + i + 1];
    }
    sram[species + count - 1] = 0xFF;

    // Shift pokemon data blocks
    for (let i = slotIndex; i < count - 1; i++) {
        const src = base + BOX_DATA_OFFSET + (i + 1) * BOX_MON_SIZE;
        const dst = base + BOX_DATA_OFFSET + i * BOX_MON_SIZE;
        sram.copyWithin(dst, src, src + BOX_MON_SIZE);
    }
    sram.fill(0, base + BOX_DATA_OFFSET + (count - 1) * BOX_MON_SIZE, base + BOX_DATA_OFFSET + count * BOX_MON_SIZE);

    shiftNames(sram, base + BOX_OT_OFFSET, slotIndex, count);
    shiftNames(sram, base + BOX_NICK_OFFSET, slotIndex, count);

    sram[base] = count - 1;
    syncCurrentBoxToBanked(sram, boxNumber);
}

export function injectPokemon(
    sramData: Uint8Array,
    rawBoxData: Buffer,
    names: PokemonNames,
    appTrainerId: number,
    targetSlot: SaveSlot
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
        injectParty(sram, rawBoxData, names, stats);
    } else {
        injectBox(sram, rawBoxData, names, targetSlot.boxNumber!);
    }

    writeMainChecksum(sram);
    return sram;
}

function injectParty(
    sram: Uint8Array,
    rawBoxData: Buffer,
    names: PokemonNames,
    stats: ReturnType<typeof calcGen1Stats>
): void {
    const count = sram[PARTY_BASE];
    if (count >= PARTY_CAPACITY) throw new Error('Party is full');

    const speciesIndex = rawBoxData[0x00];
    const level = rawBoxData[0x03];

    // Gen 1 slots are contiguous — always append at count; terminator goes one beyond.
    sram[PARTY_SPECIES + count] = speciesIndex;
    sram[PARTY_SPECIES + count + 1] = 0xFF;

    // Build 44-byte party form
    const partyBytes = new Uint8Array(PARTY_MON_SIZE);
    partyBytes.set(rawBoxData.subarray(0, BOX_MON_SIZE), 0);
    partyBytes[0x21] = level;
    writeUint16BE(partyBytes, 0x22, stats.maxHP);
    writeUint16BE(partyBytes, 0x24, stats.attack);
    writeUint16BE(partyBytes, 0x26, stats.defense);
    writeUint16BE(partyBytes, 0x28, stats.speed);
    writeUint16BE(partyBytes, 0x2A, stats.special);

    sram.set(partyBytes, PARTY_DATA + count * PARTY_MON_SIZE);

    writeNameAt(sram, PARTY_OT + count * NAME_LENGTH, names.otName);
    writeNameAt(sram, PARTY_NICK + count * NAME_LENGTH, names.nickname);

    sram[PARTY_BASE] = count + 1;
}

function injectBox(
    sram: Uint8Array,
    rawBoxData: Buffer,
    names: PokemonNames,
    boxNumber: number
): void {
    const base = boxBase(sram, boxNumber);
    const count = sram[base];
    if (count >= BOX_CAPACITY) throw new Error('Box is full');

    // Gen 1 slots are contiguous — always append at count; terminator goes one beyond.
    const species = base + BOX_SPECIES_OFFSET;
    sram[species + count] = rawBoxData[0x00];
    sram[species + count + 1] = 0xFF;

    sram.set(rawBoxData.subarray(0, BOX_MON_SIZE), base + BOX_DATA_OFFSET + count * BOX_MON_SIZE);

    writeNameAt(sram, base + BOX_OT_OFFSET + count * NAME_LENGTH, names.otName);
    writeNameAt(sram, base + BOX_NICK_OFFSET + count * NAME_LENGTH, names.nickname);

    sram[base] = count + 1;
    syncCurrentBoxToBanked(sram, boxNumber);
}

function shiftNames(sram: Uint8Array, base: number, from: number, count: number): void {
    for (let i = from; i < count - 1; i++) {
        sram.copyWithin(base + i * NAME_LENGTH, base + (i + 1) * NAME_LENGTH, base + (i + 1) * NAME_LENGTH + NAME_LENGTH);
    }
    sram.fill(0x50, base + (count - 1) * NAME_LENGTH, base + count * NAME_LENGTH);
}

function writeNameAt(sram: Uint8Array, offset: number, name: ArrayLike<number>): void {
    for (let i = 0; i < NAME_LENGTH; i++) {
        sram[offset + i] = name[i] ?? 0x50;
    }
}

function writeUint16BE(buf: Uint8Array, offset: number, value: number): void {
    buf[offset] = (value >> 8) & 0xFF;
    buf[offset + 1] = value & 0xFF;
}
