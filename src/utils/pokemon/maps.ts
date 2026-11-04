import { readString, Rom } from './moves';

const ROM_BANK_SIZE = 0x4000;
const EXTERNAL_ENTRY_SIZE = 3; // coordinates, name pointer
const INTERNAL_ENTRY_SIZE = 4; // last map ID + 1, coordinates, name pointer
const INTERNAL_TABLE_END = 0xFF;

// Instruction patterns from the game's own routines, with null for bytes that
// vary. Hacks move RAM and tables around, but these routines keep their shape.

// LoadMapHeader: ld a, [wCurMap]; call SwitchToMapRomBank; then edits wCurMapTileset
const CURRENT_MAP_PATTERN = [
    0xFA, null, null, 0xCD, null, null, 0xFA, null, null, 0x47,
    0xCB, 0xBF, 0xEA, null, null, 0xE0, 0x8B, 0xCB, 0x78, 0xC0,
];
const CURRENT_MAP_ADDRESS_OFFSET = 1;

// LoadTownMapEntry: splits on FIRST_INDOOR_MAP, then indexes one of two name tables
const TOWN_MAP_ENTRY_PATTERN = [
    0xFE, null, 0x38, 0x0F, 0x01, 0x04, 0x00, 0x21, null, null,
    0xBE, 0x38, 0x03, 0x09, 0x18, 0xFA, 0x23, 0x18, 0x09, 0x21,
    null, null, 0x4F, 0x06, 0x00, 0x09, 0x09, 0x09, 0x2A, 0x12,
    0x2A, 0x66, 0x6F, 0xC9,
];
const FIRST_INDOOR_MAP_OFFSET = 1;
const INTERNAL_TABLE_POINTER_OFFSET = 8;
const EXTERNAL_TABLE_POINTER_OFFSET = 20;

/**
 * Artwork for each place name as the ROM spells it. Interiors share their
 * town's name, so they use its artwork too. Places not listed here keep the
 * current background.
 */
const LOCATION_IMAGES: Record<string, string> = {
    'PALLET TOWN': 'pallet-oaks-lab.png',
    'VIRIDIAN CITY': 'viridian-city.png',
    'PEWTER CITY': 'pewter-city.png',
    'CERULEAN CITY': 'cerulean-city.png',
    'LAVENDER TOWN': 'lavender-town.png',
    'VERMILION CITY': 'vermillion-city.png',
    'CELADON CITY': 'celadon-city.png',
    'FUCHSIA CITY': 'fuchsia-city.png',
    'CINNABAR ISLAND': 'cinnabar-island.png',
    'INDIGO PLATEAU': 'indigo-plateau.png',
    'SAFFRON CITY': 'saffron-city.png',
    'ROUTE 1': 'routes/1.png',
    'ROUTE 2': 'routes/2.png',
    'ROUTE 3': 'routes/3.png',
    'ROUTE 4': 'routes/4.png',
    'ROUTE 5': 'routes/5.png',
    'ROUTE 6': 'routes/24.png',
    'ROUTE 7': 'routes/7.png',
    'ROUTE 8': 'routes/8.png',
    'ROUTE 16': 'routes/16.png',
    'ROUTE 17': 'routes/17.png',
    'ROUTE 18': 'routes/18.png',
    'ROUTE 24': 'routes/24-nugget-bridge.png',
    'ROUTE 25': 'routes/25.png',
    'VIRIDIAN FOREST': 'viridian-forest.png',
    'MT.MOON': 'mt-moon.png',
    'SEA COTTAGE': 'bills-lighthouse.png',
    'SEAFOAM ISLANDS': 'seafoam-islands.png',
    "DIGLETT's CAVE": 'digletts-cave.jpeg',
    'SAFARI ZONE': 'safari-zone.png',
    'CERULEAN CAVE': 'cerulean-cave.png',
};

interface MapData {
    currentMapAddress: number | null;
    townMap: {
        firstIndoorMap: number;
        bankStart: number;
        internalTable: number;
        externalTable: number;
    } | null;
}

const mapDataCache = new WeakMap<object, MapData>();

function findPattern(rom: Rom, pattern: (number | null)[]) {
    const lastOffset = rom.length - pattern.length;
    for (let offset = 0; offset <= lastOffset; offset++) {
        if (pattern.every((byte, index) => byte === null || rom[offset + index] === byte)) return offset;
    }
    return null;
}

const readWord = (rom: Rom, offset: number) => rom[offset] | (rom[offset + 1] << 8);

function parseMapData(rom: Rom): MapData {
    const currentMapRoutine = findPattern(rom, CURRENT_MAP_PATTERN);
    const townMapRoutine = findPattern(rom, TOWN_MAP_ENTRY_PATTERN);

    let townMap: MapData['townMap'] = null;
    if (townMapRoutine !== null) {
        const bankStart = Math.floor(townMapRoutine / ROM_BANK_SIZE) * ROM_BANK_SIZE;
        const toFileOffset = (pointer: number) => bankStart + pointer - ROM_BANK_SIZE;
        townMap = {
            firstIndoorMap: rom[townMapRoutine + FIRST_INDOOR_MAP_OFFSET],
            bankStart,
            internalTable: toFileOffset(readWord(rom, townMapRoutine + INTERNAL_TABLE_POINTER_OFFSET)),
            externalTable: toFileOffset(readWord(rom, townMapRoutine + EXTERNAL_TABLE_POINTER_OFFSET)),
        };
    }

    return {
        currentMapAddress:
            currentMapRoutine === null ? null : readWord(rom, currentMapRoutine + CURRENT_MAP_ADDRESS_OFFSET),
        townMap,
    };
}

function getMapData(rom: Rom) {
    let data = mapDataCache.get(rom);
    if (!data) {
        data = parseMapData(rom);
        mapDataCache.set(rom, data);
    }
    return data;
}

/** The RAM address holding the current map ID (wCurMap) in this ROM. */
export function getCurrentMapAddress(rom: Rom | null) {
    return rom ? getMapData(rom).currentMapAddress : null;
}

/** The place name the ROM's town map shows for a map ID. */
export function getMapName(rom: Rom | null, mapId: number) {
    const townMap = rom && getMapData(rom).townMap;
    if (!rom || !townMap) return null;

    let pointerOffset: number;
    if (mapId < townMap.firstIndoorMap) {
        pointerOffset = townMap.externalTable + mapId * EXTERNAL_ENTRY_SIZE + 1;
    } else {
        let entry = townMap.internalTable;
        while (mapId >= rom[entry]) {
            if (rom[entry] === INTERNAL_TABLE_END) return null;
            entry += INTERNAL_ENTRY_SIZE;
        }
        pointerOffset = entry + 2;
    }

    const pointer = readWord(rom, pointerOffset);
    if (pointer < ROM_BANK_SIZE || pointer >= ROM_BANK_SIZE * 2) return null;
    return readString(rom, townMap.bankStart + pointer - ROM_BANK_SIZE);
}

/** The artwork file for a map ID, if there is artwork for its place. */
export function getMapImage(rom: Rom | null, mapId: number) {
    const name = getMapName(rom, mapId);
    return name ? LOCATION_IMAGES[name] ?? null : null;
}
