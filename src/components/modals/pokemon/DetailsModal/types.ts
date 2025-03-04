export interface PokemonDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    pokemon: PokemonDetails;
}

export interface PokemonDetails {
    nickname: string;
    speciesName: string;
    pokedexNo: number;
    otName: string;
    structure: {
        type1: string;
        type2: string;
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

export interface Move {
    id: number;
    pp: number;
}