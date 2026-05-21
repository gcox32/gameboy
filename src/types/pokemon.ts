import { GameModel } from "./models";
import { SRAMArray } from "./sram";

export interface ActivePartyProps {
    inGameMemory: number[];
    gbcMemory?: SRAMArray | number[];
    onPauseResume: () => void;
    intervalPaused: boolean;
    activeROM: GameModel;
}

export interface PokemonDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    pokemon: PokemonDetails;
}

/** Crystal only. undefined means the Pokémon was not caught in Crystal (Gold/Silver, traded from Gen 1, or hatched in a non-Crystal game). */
export interface CaughtData {
    timeOfDay: 'morning' | 'day' | 'night';
    caughtLevel: number;
    otGender: 'male' | 'female';
    locationIndex: number;
}

export interface PokemonDetails {
    speciesIndex: number;
    nickname?: string;
    speciesName?: string;
    pokedexNo: string;
    otName?: string;
    /** Gen 1's catch rate byte occupies the same offset; a Pokémon traded from Gen 1 will have its catch rate read as this value. */
    heldItem?: number;
    /** Always assigned a default when entering Gen 2 (even from Gen 1); cleared to 0 on trade to Gen 1. */
    friendship?: number;
    /** Cleared to 0 when traded to Gen 1; a round-tripped Pokémon loses its Pokérus status permanently. */
    pokerus?: number;
    /** undefined = not caught in Crystal (Gold/Silver native, Gen 1 trade, or 0x0000 blank). */
    caughtData?: CaughtData;
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
            specialAttack?: number;
            specialDefense?: number;
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
    pp?: number;
    name?: string;
}

export interface MoveDetails {
    name: string;
    type: string;
    PP: number;
    basepower: number;
    accuracy: number;
    clean_description: string;
}

export interface MovesetProps {
    moves: Move[]
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

export interface TM {
    id: string;
    name: string;
    hiddenMachine?: boolean;
}

export interface Gym {
    name: string;
    description?: string;
    gymLocation?: string;
    badge: Badge;
    badgeEarned?: boolean;
    leader: string;
    leaderImage?: string;
    leaderDescription?: string;
}

export interface Badge {
    name: string;
    image: string;
    giver?: string;
    hm?: TM;
    obeyLevel?: number;
    statBoost?: 'attack' | 'defense' | 'speed' | 'special';
}