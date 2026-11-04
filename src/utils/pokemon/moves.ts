import { translateIntegerArray } from '../MemoryWatcher';
import { MoveDetails } from '@/types/pokemon';

export type Rom = Uint8Array | number[];

// Gen 1 move table entry: animation, effect, power, type, accuracy, PP.
const MOVE_ENTRY_SIZE = 6;
const VANILLA_MOVE_COUNT = 165;
const MAX_MOVE_COUNT = 255;
const MAX_MOVE_PP = 63; // current PP is stored in 6 bits
const MIN_ANIMATION_MATCHES = 100;
const STRING_TERMINATOR = 0x50;
const MAX_NAME_LENGTH = 20;
const ROM_BANK_SIZE = 0x4000;
const TYPE_COUNT = 27;

interface MoveData {
    moves: Map<number, MoveDetails>;
}

const moveDataCache = new WeakMap<object, MoveData | null>();

const encodeText = (text: string) =>
    Array.from(text, (char) => (char === '@' ? STRING_TERMINATOR : 0x80 + char.charCodeAt(0) - 65));

function matchesBytes(rom: Rom, offset: number, bytes: number[]) {
    return bytes.every((byte, index) => rom[offset + index] === byte);
}

export function readString(rom: Rom, offset: number) {
    const bytes: number[] = [];
    for (let i = offset; i < offset + MAX_NAME_LENGTH && i < rom.length && rom[i] !== STRING_TERMINATOR; i++) {
        bytes.push(rom[i]);
    }
    return translateIntegerArray(bytes);
}

/**
 * Hacks can move the table, so scan for it. The animation byte equals the move
 * ID nearly everywhere, which identifies the table without relying on its stats.
 */
function findMoveTable(rom: Rom) {
    let bestOffset = -1;
    let bestScore = MIN_ANIMATION_MATCHES - 1;
    const lastOffset = rom.length - MOVE_ENTRY_SIZE * VANILLA_MOVE_COUNT;

    for (let offset = 0; offset <= lastOffset; offset++) {
        if (rom[offset] !== 1 || rom[offset + MOVE_ENTRY_SIZE] !== 2) continue;
        let score = 0;
        for (let i = 0; i < VANILLA_MOVE_COUNT; i++) {
            if (rom[offset + i * MOVE_ENTRY_SIZE] === i + 1) score++;
        }
        if (score > bestScore) {
            bestScore = score;
            bestOffset = offset;
        }
    }
    return bestOffset === -1 ? null : bestOffset;
}

function findMoveNames(rom: Rom) {
    const anchor = encodeText('POUND@KARATE');
    for (let offset = 0; offset <= rom.length - anchor.length; offset++) {
        if (matchesBytes(rom, offset, anchor)) return offset;
    }
    return null;
}

/** Finds the pointer table whose first two entries are NORMAL and FIGHTING. */
function findTypeNames(rom: Rom) {
    const normal = encodeText('NORMAL@');
    const fighting = encodeText('FIGHTING@');
    const lastOffset = rom.length - TYPE_COUNT * 2;

    for (let offset = ROM_BANK_SIZE; offset <= lastOffset; offset++) {
        const target = typeNameOffset(rom, offset, 0);
        if (target === null || rom[target] !== normal[0] || !matchesBytes(rom, target, normal)) continue;
        const second = typeNameOffset(rom, offset, 1);
        if (second !== null && matchesBytes(rom, second, fighting)) return offset;
    }
    return null;
}

/** Resolves a pointer table entry to a file offset in the table's own bank. */
function typeNameOffset(rom: Rom, table: number, type: number) {
    const pointer = rom[table + type * 2] | (rom[table + type * 2 + 1] << 8);
    if (pointer < ROM_BANK_SIZE || pointer >= ROM_BANK_SIZE * 2) return null;
    return Math.floor(table / ROM_BANK_SIZE) * ROM_BANK_SIZE + (pointer - ROM_BANK_SIZE);
}

function readTypeName(rom: Rom, typeNames: number | null, type: number) {
    if (typeNames !== null && type < TYPE_COUNT) {
        const offset = typeNameOffset(rom, typeNames, type);
        if (offset !== null) return readString(rom, offset);
    }
    return `TYPE ${type}`;
}

function parseMoveData(rom: Rom): MoveData | null {
    const table = findMoveTable(rom);
    if (table === null) {
        console.warn('No Gen 1 move table found in this ROM.');
        return null;
    }

    const typeNames = findTypeNames(rom);
    let nameOffset = findMoveNames(rom);
    const moves = new Map<number, MoveDetails>();

    for (let id = 1; id <= MAX_MOVE_COUNT; id++) {
        const entry = table + (id - 1) * MOVE_ENTRY_SIZE;
        const pp = rom[entry + 5];
        if (entry + MOVE_ENTRY_SIZE > rom.length || pp === 0 || pp > MAX_MOVE_PP) break;
        // Past the vanilla count, only a matching animation shows the table continues
        if (id > VANILLA_MOVE_COUNT && rom[entry] !== id) break;

        let name = `MOVE ${id}`;
        if (nameOffset !== null) {
            name = readString(rom, nameOffset);
            while (nameOffset < rom.length && rom[nameOffset] !== STRING_TERMINATOR) nameOffset++;
            nameOffset++;
        }

        moves.set(id, {
            name,
            type: readTypeName(rom, typeNames, rom[entry + 3]),
            PP: pp,
            basepower: rom[entry + 2],
            accuracy: Math.round((rom[entry + 4] * 100) / 255),
        });
    }

    return { moves };
}

/** Looks up a move in the running game's ROM. Parsing happens once per ROM. */
export function getMoveDetails(rom: Rom | null, moveId: number): MoveDetails | null {
    if (!rom || moveId === 0) return null;
    if (!moveDataCache.has(rom)) moveDataCache.set(rom, parseMoveData(rom));
    return moveDataCache.get(rom)?.moves.get(moveId) ?? null;
}

/** Each PP Up adds a fifth of the base PP, capped at 7 (see AddBonusPP in pokered). */
export function getMaxPP(basePP: number, ppUps = 0) {
    return basePP + Math.min(Math.floor(basePP / 5), 7) * ppUps;
}
