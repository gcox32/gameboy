import { getPresetByRomTitle, GameMemoryPreset } from '@/data/memoryPresets';

// Game Boy ROM header offsets
const ROM_HEADER = {
    TITLE_START: 0x0134,
    TITLE_END: 0x0143,
    CGB_FLAG: 0x0143,
    NEW_LICENSEE: 0x0144,
    SGB_FLAG: 0x0146,
    CARTRIDGE_TYPE: 0x0147,
    ROM_SIZE: 0x0148,
    RAM_SIZE: 0x0149,
    DESTINATION: 0x014A,
    OLD_LICENSEE: 0x014B,
    VERSION: 0x014C,
    HEADER_CHECKSUM: 0x014D,
    GLOBAL_CHECKSUM: 0x014E,
};

export interface RomInfo {
    title: string;
    isColorGame: boolean;
    cartridgeType: number;
    romSize: number;
    ramSize: number;
    version: number;
    headerChecksum: number;
}

/**
 * Extract ROM title from ROM data
 * The title is stored at 0x0134-0x0143 (16 bytes max, though older games use 0x0134-0x013E)
 */
export function extractRomTitle(romData: number[] | Uint8Array): string {
    const titleBytes: number[] = [];

    for (let i = ROM_HEADER.TITLE_START; i <= ROM_HEADER.TITLE_END; i++) {
        const byte = romData[i];
        // Stop at null terminator or non-printable character
        if (byte === 0x00 || byte < 0x20 || byte > 0x7E) {
            break;
        }
        titleBytes.push(byte);
    }

    return String.fromCharCode(...titleBytes).trim();
}

/**
 * Extract full ROM info from ROM data
 */
export function extractRomInfo(romData: number[] | Uint8Array): RomInfo {
    const title = extractRomTitle(romData);
    const cgbFlag = romData[ROM_HEADER.CGB_FLAG];

    return {
        title,
        isColorGame: cgbFlag === 0x80 || cgbFlag === 0xC0,
        cartridgeType: romData[ROM_HEADER.CARTRIDGE_TYPE],
        romSize: romData[ROM_HEADER.ROM_SIZE],
        ramSize: romData[ROM_HEADER.RAM_SIZE],
        version: romData[ROM_HEADER.VERSION],
        headerChecksum: romData[ROM_HEADER.HEADER_CHECKSUM],
    };
}

/**
 * Detect game and get memory preset from ROM data
 */
export function detectGamePreset(romData: number[] | Uint8Array): {
    romInfo: RomInfo;
    preset: GameMemoryPreset | null;
} {
    const romInfo = extractRomInfo(romData);
    const preset = getPresetByRomTitle(romInfo.title);

    return { romInfo, preset };
}

/**
 * Check if this appears to be a Pokemon game based on ROM title
 */
export function isPokemonGame(romData: number[] | Uint8Array): boolean {
    const title = extractRomTitle(romData);
    return title.toUpperCase().includes('POKEMON') ||
           title.toUpperCase().includes('PM_');
}

/**
 * Determine the generation of a Pokemon game from ROM info
 */
export function detectGeneration(romData: number[] | Uint8Array): 1 | 2 | null {
    const { romInfo, preset } = detectGamePreset(romData);

    if (preset) {
        return preset.generation;
    }

    // Fallback: Gen 2 games are GBC-enhanced or GBC-only
    if (isPokemonGame(romData)) {
        return romInfo.isColorGame ? 2 : 1;
    }

    return null;
}
