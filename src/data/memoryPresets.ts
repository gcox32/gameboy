import { MemoryWatcherConfig } from '@/types/states';

export interface GameMemoryPreset {
    generation: 1 | 2;
    activeParty: MemoryWatcherConfig;
    gymBadges: MemoryWatcherConfig;
    location: MemoryWatcherConfig;
    // Pokemon data structure info for parsing
    pokemonDataSize: number; // bytes per Pokemon in party
    maxPartySize: number;
    totalBadges: number;
}

// ROM titles as they appear in the header (uppercase, padded)
// These are read from 0x0134-0x0143 in the ROM
export const MEMORY_PRESETS: Record<string, GameMemoryPreset> = {
    // Pokemon Red (various versions)
    'POKEMON RED': {
        generation: 1,
        activeParty: { baseAddress: '0xD163', offset: '0x00', size: '0x195' },
        gymBadges: { baseAddress: '0xD356', offset: '0x00', size: '0x01' },
        location: { baseAddress: '0xD35E', offset: '0x00', size: '0x01' },
        pokemonDataSize: 44,
        maxPartySize: 6,
        totalBadges: 8,
    },

    // Pokemon Blue
    'POKEMON BLUE': {
        generation: 1,
        activeParty: { baseAddress: '0xD163', offset: '0x00', size: '0x195' },
        gymBadges: { baseAddress: '0xD356', offset: '0x00', size: '0x01' },
        location: { baseAddress: '0xD35E', offset: '0x00', size: '0x01' },
        pokemonDataSize: 44,
        maxPartySize: 6,
        totalBadges: 8,
    },

    // Pokemon Yellow
    'POKEMON YELLOW': {
        generation: 1,
        activeParty: { baseAddress: '0xD163', offset: '0x00', size: '0x195' },
        gymBadges: { baseAddress: '0xD356', offset: '0x00', size: '0x01' },
        location: { baseAddress: '0xD35E', offset: '0x00', size: '0x01' },
        pokemonDataSize: 44,
        maxPartySize: 6,
        totalBadges: 8,
    },

    // Pokemon Gold
    'POKEMON GOLD': {
        generation: 2,
        activeParty: { baseAddress: '0xDCD7', offset: '0x00', size: '0x1A0' },
        gymBadges: { baseAddress: '0xD57C', offset: '0x00', size: '0x02' }, // 16 badges = 2 bytes
        location: { baseAddress: '0xDCB6', offset: '0x00', size: '0x01' },
        pokemonDataSize: 48,
        maxPartySize: 6,
        totalBadges: 16,
    },

    // Pokemon Silver
    'POKEMON SILVER': {
        generation: 2,
        activeParty: { baseAddress: '0xDCD7', offset: '0x00', size: '0x1A0' },
        gymBadges: { baseAddress: '0xD57C', offset: '0x00', size: '0x02' },
        location: { baseAddress: '0xDCB6', offset: '0x00', size: '0x01' },
        pokemonDataSize: 48,
        maxPartySize: 6,
        totalBadges: 16,
    },

    // Pokemon Crystal
    'POKEMON CRYSTAL': {
        generation: 2,
        activeParty: { baseAddress: '0xDCD7', offset: '0x00', size: '0x1A0' },
        gymBadges: { baseAddress: '0xD57C', offset: '0x00', size: '0x02' },
        location: { baseAddress: '0xDCB6', offset: '0x00', size: '0x01' },
        pokemonDataSize: 48,
        maxPartySize: 6,
        totalBadges: 16,
    },
};

// Alternative ROM titles (Japanese, revisions, etc.)
export const ROM_TITLE_ALIASES: Record<string, string> = {
    'POKEMON_RED': 'POKEMON RED',
    'POKEMON_BLUE': 'POKEMON BLUE',
    'POKEMON_YELLW': 'POKEMON YELLOW',
    'POKEMON YELLO': 'POKEMON YELLOW', // Truncated versions
    'POKEMON_YELLO': 'POKEMON YELLOW',
    'POKEMONYELLOW': 'POKEMON YELLOW',
    'POKEMON_GLDAAUE': 'POKEMON GOLD',
    'POKEMON_SLVAAXE': 'POKEMON SILVER',
    'PM_CRYSTAL': 'POKEMON CRYSTAL',
};

export function getPresetByRomTitle(title: string): GameMemoryPreset | null {
    const normalizedTitle = title.toUpperCase().trim();

    // Direct match
    if (MEMORY_PRESETS[normalizedTitle]) {
        return MEMORY_PRESETS[normalizedTitle];
    }

    // Check aliases
    if (ROM_TITLE_ALIASES[normalizedTitle]) {
        return MEMORY_PRESETS[ROM_TITLE_ALIASES[normalizedTitle]];
    }

    // Fuzzy match - check if title contains a known game name
    for (const knownTitle of Object.keys(MEMORY_PRESETS)) {
        if (normalizedTitle.includes(knownTitle.replace('POKEMON ', ''))) {
            return MEMORY_PRESETS[knownTitle];
        }
    }

    return null;
}

export function getDefaultPreset(): GameMemoryPreset {
    return MEMORY_PRESETS['POKEMON RED'];
}
