import { BASE_STATS } from './baseStats';

export interface Gen1Stats {
    maxHP: number;
    attack: number;
    defense: number;
    speed: number;
    special: number;
}

export function calcGen1Stats(rawBoxData: ArrayLike<number>): Gen1Stats {
    const speciesIndex = rawBoxData[0x00];
    const level = rawBoxData[0x03];

    const hpEvRaw = (rawBoxData[0x11] << 8) | rawBoxData[0x12];
    const atkEvRaw = (rawBoxData[0x13] << 8) | rawBoxData[0x14];
    const defEvRaw = (rawBoxData[0x15] << 8) | rawBoxData[0x16];
    const spdEvRaw = (rawBoxData[0x17] << 8) | rawBoxData[0x18];
    const spcEvRaw = (rawBoxData[0x19] << 8) | rawBoxData[0x1A];

    const ivRaw = (rawBoxData[0x1B] << 8) | rawBoxData[0x1C];
    const atkIV = (ivRaw >> 12) & 0xF;
    const defIV = (ivRaw >> 8) & 0xF;
    const spdIV = (ivRaw >> 4) & 0xF;
    const spcIV = ivRaw & 0xF;
    const hpIV = ((atkIV & 1) << 3) | ((defIV & 1) << 2) | ((spdIV & 1) << 1) | (spcIV & 1);

    const base = BASE_STATS[speciesIndex] ?? { hp: 45, atk: 45, def: 45, spd: 45, spc: 45 };

    return {
        maxHP: calcHP(base.hp, hpIV, hpEvRaw, level),
        attack: calcStat(base.atk, atkIV, atkEvRaw, level),
        defense: calcStat(base.def, defIV, defEvRaw, level),
        speed: calcStat(base.spd, spdIV, spdEvRaw, level),
        special: calcStat(base.spc, spcIV, spcEvRaw, level),
    };
}

function calcStat(base: number, iv: number, ev: number, level: number): number {
    return Math.floor(((base + iv) * 2 + Math.floor(Math.sqrt(ev))) * level / 100) + 5;
}

function calcHP(base: number, iv: number, ev: number, level: number): number {
    return Math.floor(((base + iv) * 2 + Math.floor(Math.sqrt(ev))) * level / 100) + level + 10;
}
