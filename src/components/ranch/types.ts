export interface RanchPokemon {
    id: string;
    speciesIndex: number;
    speciesName: string;
    nickname: string;
    otName: string;
    otId: number;
    level: number;
    rawBoxData: { type: 'Buffer'; data: number[] };
    status: 'stashed';
    extractedAt: string;
    generation: number;
    sourceGameId: string;
}

export function getRawBytes(rawBoxData: RanchPokemon['rawBoxData']): number[] {
    return rawBoxData.data;
}
