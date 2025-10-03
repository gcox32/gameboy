

export interface ActivePartyProps {
    inGameMemory: any[];
    onPauseResume: () => void;
    intervalPaused: boolean;
    activeROM: any;
}

export interface PokemonDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    pokemon: PokemonDetails;
}

export interface PokemonDetails {
    speciesIndex: number;
    nickname?: string;
    speciesName?: string;
    pokedexNo: string;
    otName?: string;
    structure: {
        type1?: string;
        type2?: string;
        moves: Move[];
        level: number;
        levelStats: {
            maxHP: number;
            attack: number;
            defense: number;
            speed: number;
            special: number;
        };
        EVs: {
            hp: number;
            attack: number;
            defense: number;
            speed: number;
            special: number;
        };
        IVs: {
            hp: number;
            attack: number;
            defense: number;
            speed: number;
            special: number;
        };
        currentHP: number;
    }
}

export interface PartyDataStructure {
    numberOfPokemon: number;
    pokemonList: PokemonDetails[];
}

export interface Move {
    id: number;
    pp: number;
}

export interface Location {
    x: number;
    y: number;
    height: number;
    width: number;
    locType?: string;
    title: string;
    slogan?: string;
    img?: string;
    desc?: string;
    persons?: string[];
    places?: string[];
}