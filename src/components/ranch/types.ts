import type { StoredMove } from '@/lib/romMoves';

export interface RanchPokemon {
    id: string;
    speciesIndex: number;
    speciesName: string;
    nickname: string;
    otName: string;
    otId: number;
    level: number;
    rawBoxData: { type: 'Buffer'; data: number[] };
    /** Its moves as the game it came from describes them. Absent on older records. */
    moves?: StoredMove[];
    status: 'stashed';
    extractedAt: string;
    generation: number;
    sourceGameId: string;
    /** Always set once the Ranch has settled it, which GET /api/ranch does */
    penId: string | null;
}

export interface RanchPen {
    id: string;
    name: string;
    order: number;
}

/** GET /api/ranch */
export interface RanchData {
    capacity: number;
    pens: RanchPen[];
    pokemon: RanchPokemon[];
}

export function getRawBytes(rawBoxData: RanchPokemon['rawBoxData']): number[] {
    return rawBoxData.data;
}
