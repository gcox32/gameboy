export interface Pokemon {
    id: number;
    name: string;
    type: string;
    level: number;
    hp: number;
    pokedexNo: number;
    speciesName: string;
}

export interface PartySlotProps {
    pokemon: Pokemon;
    onClick: (pokemon: Pokemon) => void;
}

export interface ActivePartyProps {
    inGameMemory: any[];
    onPauseResume: () => void;
    intervalPaused: boolean;
}