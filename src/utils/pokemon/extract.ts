import { TextEncoder } from '@/utils/sramParser';
import { dexDict } from './dicts';
import { BOX_MON_SIZE, NAME_LENGTH, SaveSlot, isSlotOccupied, locateSlot } from './gen1Save';

export interface RawExtractedPokemon {
    rawBoxData: Buffer;     // 33 bytes
    nickname: string;       // decoded, for display
    otName: string;         // decoded, for display
    nicknameBytes: Buffer;  // 11 bytes, written back unchanged on port
    otNameBytes: Buffer;    // 11 bytes, written back unchanged on port
    otId: number;
    speciesIndex: number;
    speciesName: string;
    level: number;
}

export function extractFromSRAM(sram: Uint8Array, slot: SaveSlot): RawExtractedPokemon {
    if (!isSlotOccupied(sram, slot)) {
        const where = slot.location === 'party' ? 'Party' : `Box ${slot.boxNumber}`;
        throw new Error(`${where} slot ${slot.slotIndex} is empty`);
    }

    const { dataOffset, otOffset, nicknameOffset } = locateSlot(sram, slot);
    const rawBoxData = Buffer.from(sram.subarray(dataOffset, dataOffset + BOX_MON_SIZE));

    // Byte 0x03 (box level) may be stale for party Pokémon that leveled up without
    // being deposited. The authoritative party level is at byte 0x21 of the 44-byte form.
    if (slot.location === 'party') rawBoxData[0x03] = sram[dataOffset + 0x21];

    const otNameBytes = Buffer.from(sram.subarray(otOffset, otOffset + NAME_LENGTH));
    const nicknameBytes = Buffer.from(sram.subarray(nicknameOffset, nicknameOffset + NAME_LENGTH));

    const speciesIndex = rawBoxData[0x00];
    const speciesName = dexDict[speciesIndex]?.name ?? 'unknown';

    return {
        rawBoxData,
        // A name can decode to nothing if it only holds bytes we have no glyph for.
        nickname: TextEncoder.decodeString(Array.from(nicknameBytes)) || speciesName.toUpperCase(),
        otName: TextEncoder.decodeString(Array.from(otNameBytes)),
        nicknameBytes,
        otNameBytes,
        otId: (rawBoxData[0x0C] << 8) | rawBoxData[0x0D],
        speciesIndex,
        speciesName,
        level: rawBoxData[0x03],
    };
}
