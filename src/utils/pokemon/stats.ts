import { BASE_STATS } from './baseStats';

export interface Gen1Stats {
    maxHP: number;
    attack: number;
    defense: number;
    speed: number;
    special: number;
}

// The four IVs the game stores. HP has no bits of its own.
export interface StoredIVs {
    attack: number;
    defense: number;
    speed: number;
    special: number;
}

export interface Gen1IVs extends StoredIVs {
    hp: number;
}

export const MAX_IV = 15;

// The game builds the HP IV from the lowest bit of each stored IV.
export function hpIVFrom({ attack, defense, speed, special }: StoredIVs): number {
    return ((attack & 1) << 3) | ((defense & 1) << 2) | ((speed & 1) << 1) | (special & 1);
}

export function decodeIVs(rawBoxData: ArrayLike<number>): Gen1IVs {
    const stored = {
        attack: rawBoxData[0x1B] >> 4,
        defense: rawBoxData[0x1B] & 0xF,
        speed: rawBoxData[0x1C] >> 4,
        special: rawBoxData[0x1C] & 0xF,
    };
    return { ...stored, hp: hpIVFrom(stored) };
}

export function isValidStoredIVs(value: unknown): value is StoredIVs {
    if (!value || typeof value !== 'object') return false;
    const ivs = value as Record<string, unknown>;
    return [ivs.attack, ivs.defense, ivs.speed, ivs.special]
        .every(iv => Number.isInteger(iv) && (iv as number) >= 0 && (iv as number) <= MAX_IV);
}

export function calcGen1Stats(rawBoxData: ArrayLike<number>): Gen1Stats {
    const speciesIndex = rawBoxData[0x00];
    const level = rawBoxData[0x03];

    const hpEvRaw = (rawBoxData[0x11] << 8) | rawBoxData[0x12];
    const atkEvRaw = (rawBoxData[0x13] << 8) | rawBoxData[0x14];
    const defEvRaw = (rawBoxData[0x15] << 8) | rawBoxData[0x16];
    const spdEvRaw = (rawBoxData[0x17] << 8) | rawBoxData[0x18];
    const spcEvRaw = (rawBoxData[0x19] << 8) | rawBoxData[0x1A];

    const ivs = decodeIVs(rawBoxData);

    const base = BASE_STATS[speciesIndex] ?? { hp: 45, atk: 45, def: 45, spd: 45, spc: 45 };

    return {
        maxHP: calcHP(base.hp, ivs.hp, hpEvRaw, level),
        attack: calcStat(base.atk, ivs.attack, atkEvRaw, level),
        defense: calcStat(base.def, ivs.defense, defEvRaw, level),
        speed: calcStat(base.spd, ivs.speed, spdEvRaw, level),
        special: calcStat(base.spc, ivs.special, spcEvRaw, level),
    };
}

// Gen 1 stat exp bonus: ceil(sqrt(statExp)) capped at 255, then divided by 4.
function statExpBonus(ev: number): number {
    return Math.floor(Math.min(255, Math.ceil(Math.sqrt(ev))) / 4);
}

function calcStat(base: number, iv: number, ev: number, level: number): number {
    return Math.floor(((base + iv) * 2 + statExpBonus(ev)) * level / 100) + 5;
}

function calcHP(base: number, iv: number, ev: number, level: number): number {
    return Math.floor(((base + iv) * 2 + statExpBonus(ev)) * level / 100) + level + 10;
}
