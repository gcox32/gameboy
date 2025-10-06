// PokeAPI Type Definitions
// Based on the response structure from https://pokeapi.co/api/v2/pokemon/{id}

/**
 * Base interface for all PokeAPI resource references
 */
export interface NamedAPIResource {
  name: string;
  url: string;
}

/**
 * Pokemon ability with slot and hidden status
 */
export interface PokemonAbility {
  ability: NamedAPIResource;
  is_hidden: boolean;
  slot: number;
}

/**
 * Pokemon cries (audio files)
 */
export interface PokemonCries {
  latest: string;
  legacy: string;
}

/**
 * Pokemon form reference
 */
export interface PokemonForm {
  name: string;
  url: string;
}

/**
 * Game index for a specific version
 */
export interface GameIndex {
  game_index: number;
  version: NamedAPIResource;
}

/**
 * Held item details
 */
export interface PokemonHeldItem {
  item: NamedAPIResource;
  version_details: PokemonHeldItemVersion[];
}

export interface PokemonHeldItemVersion {
  rarity: number;
  version: NamedAPIResource;
}

/**
 * Move details with version group information
 */
export interface PokemonMove {
  move: NamedAPIResource;
  version_group_details: PokemonMoveVersion[];
}

export interface PokemonMoveVersion {
  level_learned_at: number;
  move_learn_method: NamedAPIResource;
  order: number | null;
  version_group: NamedAPIResource;
}

/**
 * Pokemon sprites with various image formats
 */
export interface PokemonSprites {
  back_default: string | null;
  back_female: string | null;
  back_shiny: string | null;
  back_shiny_female: string | null;
  front_default: string | null;
  front_female: string | null;
  front_shiny: string | null;
  front_shiny_female: string | null;
  other: {
    dream_world: {
      front_default: string | null;
      front_female: string | null;
    };
    home: {
      front_default: string | null;
      front_female: string | null;
      front_shiny: string | null;
      front_shiny_female: string | null;
    };
    "official-artwork": {
      front_default: string | null;
      front_shiny: string | null;
    };
    showdown: {
      back_default: string | null;
      back_female: string | null;
      back_shiny: string | null;
      back_shiny_female: string | null;
      front_default: string | null;
      front_female: string | null;
      front_shiny: string | null;
      front_shiny_female: string | null;
    };
  };
  versions: {
    "generation-i": {
      "red-blue": {
        back_default: string | null;
        back_gray: string | null;
        back_transparent: string | null;
        front_default: string | null;
        front_gray: string | null;
        front_transparent: string | null;
      };
      yellow: {
        back_default: string | null;
        back_gray: string | null;
        back_transparent: string | null;
        front_default: string | null;
        front_gray: string | null;
        front_transparent: string | null;
      };
    };
    "generation-ii": {
      crystal: {
        back_default: string | null;
        back_shiny: string | null;
        back_shiny_transparent: string | null;
        back_transparent: string | null;
        front_default: string | null;
        front_shiny: string | null;
        front_shiny_transparent: string | null;
        front_transparent: string | null;
      };
      gold: {
        back_default: string | null;
        back_shiny: string | null;
        front_default: string | null;
        front_shiny: string | null;
        front_transparent: string | null;
      };
      silver: {
        back_default: string | null;
        back_shiny: string | null;
        front_default: string | null;
        front_shiny: string | null;
        front_transparent: string | null;
      };
    };
    "generation-iii": {
      emerald: {
        front_default: string | null;
        front_shiny: string | null;
      };
      "firered-leafgreen": {
        back_default: string | null;
        back_shiny: string | null;
        front_default: string | null;
        front_shiny: string | null;
      };
      "ruby-sapphire": {
        back_default: string | null;
        back_shiny: string | null;
        front_default: string | null;
        front_shiny: string | null;
      };
    };
    "generation-iv": {
      "diamond-pearl": {
        back_default: string | null;
        back_female: string | null;
        back_shiny: string | null;
        back_shiny_female: string | null;
        front_default: string | null;
        front_female: string | null;
        front_shiny: string | null;
        front_shiny_female: string | null;
      };
      "heartgold-soulsilver": {
        back_default: string | null;
        back_female: string | null;
        back_shiny: string | null;
        back_shiny_female: string | null;
        front_default: string | null;
        front_female: string | null;
        front_shiny: string | null;
        front_shiny_female: string | null;
      };
      platinum: {
        back_default: string | null;
        back_female: string | null;
        back_shiny: string | null;
        back_shiny_female: string | null;
        front_default: string | null;
        front_female: string | null;
        front_shiny: string | null;
        front_shiny_female: string | null;
      };
    };
    "generation-v": {
      "black-white": {
        animated: {
          back_default: string | null;
          back_female: string | null;
          back_shiny: string | null;
          back_shiny_female: string | null;
          front_default: string | null;
          front_female: string | null;
          front_shiny: string | null;
          front_shiny_female: string | null;
        };
        back_default: string | null;
        back_female: string | null;
        back_shiny: string | null;
        back_shiny_female: string | null;
        front_default: string | null;
        front_female: string | null;
        front_shiny: string | null;
        front_shiny_female: string | null;
      };
    };
    "generation-vi": {
      "omegaruby-alphasapphire": {
        front_default: string | null;
        front_female: string | null;
        front_shiny: string | null;
        front_shiny_female: string | null;
      };
      "x-y": {
        front_default: string | null;
        front_female: string | null;
        front_shiny: string | null;
        front_shiny_female: string | null;
      };
    };
    "generation-vii": {
      icons: {
        front_default: string | null;
        front_female: string | null;
      };
      "ultra-sun-ultra-moon": {
        front_default: string | null;
        front_female: string | null;
        front_shiny: string | null;
        front_shiny_female: string | null;
      };
    };
    "generation-viii": {
      icons: {
        front_default: string | null;
        front_female: string | null;
      };
    };
  };
}

/**
 * Pokemon stat with base value and effort points
 */
export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: NamedAPIResource;
}

/**
 * Pokemon type with slot information
 */
export interface PokemonType {
  slot: number;
  type: NamedAPIResource;
}

/**
 * Main Pokemon interface - represents a complete Pokemon from PokeAPI
 */
export interface Pokemon {
  abilities: PokemonAbility[];
  base_experience: number;
  cries: PokemonCries;
  forms: PokemonForm[];
  game_indices: GameIndex[];
  height: number;
  held_items: PokemonHeldItem[];
  id: number;
  is_default: boolean;
  location_area_encounters: string;
  moves: PokemonMove[];
  name: string;
  order: number;
  past_abilities: any[]; // Usually empty, but present in the structure
  past_types: any[]; // Usually empty, but present in the structure
  species: NamedAPIResource;
  sprites: PokemonSprites;
  stats: PokemonStat[];
  types: PokemonType[];
  weight: number;
}

/**
 * Utility types for common operations
 */
export type PokemonTypeName = 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice' | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug' | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

export type StatName = 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed';

export type MoveLearnMethod = 'level-up' | 'egg' | 'tutor' | 'machine' | 'stadium-surfing-pikachu' | 'light-ball-egg' | 'colosseum-purification' | 'xd-shadow' | 'xd-purification' | 'form-change' | 'zygarde-cube' | 'max-raid-battle' | 'other';

/**
 * Type guards for runtime type checking
 */
export function isPokemon(data: any): data is Pokemon {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray(data.abilities) &&
    typeof data.base_experience === 'number' &&
    typeof data.height === 'number' &&
    typeof data.id === 'number' &&
    typeof data.name === 'string' &&
    typeof data.order === 'number' &&
    typeof data.species === 'object' &&
    data.species !== null &&
    typeof data.species.name === 'string' &&
    typeof data.species.url === 'string' &&
    Array.isArray(data.stats) &&
    Array.isArray(data.types) &&
    typeof data.weight === 'number'
  );
}

export function isNamedAPIResource(data: any): data is NamedAPIResource {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.name === 'string' &&
    typeof data.url === 'string'
  );
}

/**
 * Helper functions for common Pokemon operations
 */
export function getPokemonTypeNames(pokemon: Pokemon): string[] {
  return pokemon.types.map(type => type.type.name);
}

export function getPokemonStatValue(pokemon: Pokemon, statName: StatName): number {
  const stat = pokemon.stats.find(s => s.stat.name === statName);
  return stat ? stat.base_stat : 0;
}

export function getPokemonAbilityNames(pokemon: Pokemon): string[] {
  return pokemon.abilities.map(ability => ability.ability.name);
}

export function getPokemonMoveNames(pokemon: Pokemon): string[] {
  return pokemon.moves.map(move => move.move.name);
}

export function getPokemonSpeciesName(pokemon: Pokemon): string {
  return pokemon.species.name;
}

export function getPokemonSpriteUrl(pokemon: Pokemon, variant: 'default' | 'shiny' = 'default', gender: 'male' | 'female' = 'male', side: 'front' | 'back' = 'front'): string | null {
  const sprites = pokemon.sprites;
  const genderSuffix = gender === 'female' ? '_female' : '';
  const variantPrefix = variant === 'shiny' ? 'shiny_' : '';
  
  const key = `${side}_${variantPrefix}default${genderSuffix}` as keyof PokemonSprites;
  return sprites[key] as string | null;
}

/**
 * Constants for common Pokemon data
 */
export const POKEMON_TYPE_COLORS: Record<PokemonTypeName, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC'
};

export const STAT_NAMES: StatName[] = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

export const MOVE_LEARN_METHODS: MoveLearnMethod[] = [
  'level-up',
  'egg',
  'tutor',
  'machine',
  'stadium-surfing-pikachu',
  'light-ball-egg',
  'colosseum-purification',
  'xd-shadow',
  'xd-purification',
  'form-change',
  'zygarde-cube',
  'max-raid-battle',
  'other'
];
