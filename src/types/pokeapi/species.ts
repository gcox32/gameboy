// PokeAPI Pokemon Species Type Definitions
// Based on the response structure from https://pokeapi.co/api/v2/pokemon-species/{id}

/**
 * Base interface for all PokeAPI resource references
 */
export interface NamedAPIResource {
  name: string;
  url: string;
}

/**
 * Flavor text entry with language and version information
 */
export interface FlavorTextEntry {
  flavor_text: string;
  language: NamedAPIResource;
  version: NamedAPIResource;
}

/**
 * Genus entry with language information
 */
export interface Genus {
  genus: string;
  language: NamedAPIResource;
}

/**
 * Name entry with language information
 */
export interface Name {
  language: NamedAPIResource;
  name: string;
}

/**
 * Pokedex number entry
 */
export interface PokedexNumber {
  entry_number: number;
  pokedex: NamedAPIResource;
}

/**
 * Pal Park encounter information
 */
export interface PalParkEncounter {
  area: NamedAPIResource;
  base_score: number;
  rate: number;
}

/**
 * Pokemon variety information
 */
export interface PokemonVariety {
  is_default: boolean;
  pokemon: NamedAPIResource;
}

/**
 * Main Pokemon Species interface - represents a complete Pokemon species from PokeAPI
 */
export interface PokemonSpecies {
  base_happiness: number;
  capture_rate: number;
  color: NamedAPIResource;
  egg_groups: NamedAPIResource[];
  evolution_chain: {
    url: string;
  };
  evolves_from_species: NamedAPIResource | null;
  flavor_text_entries: FlavorTextEntry[];
  form_descriptions: any[]; // Usually empty, but present in the structure
  forms_switchable: boolean;
  gender_rate: number;
  genera: Genus[];
  generation: NamedAPIResource;
  growth_rate: NamedAPIResource;
  habitat: NamedAPIResource | null;
  has_gender_differences: boolean;
  hatch_counter: number;
  id: number;
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
  name: string;
  names: Name[];
  order: number;
  pal_park_encounters: PalParkEncounter[];
  pokedex_numbers: PokedexNumber[];
  shape: NamedAPIResource | null;
  varieties: PokemonVariety[];
}

/**
 * Utility types for common operations
 */
export type PokemonColor = 'black' | 'blue' | 'brown' | 'gray' | 'green' | 'pink' | 'purple' | 'red' | 'white' | 'yellow';

export type EggGroup = 'monster' | 'water1' | 'water2' | 'water3' | 'bug' | 'flying' | 'ground' | 'fairy' | 'plant' | 'humanshape' | 'mineral' | 'indeterminate' | 'ditto' | 'dragon' | 'no-eggs';

export type GrowthRate = 'slow' | 'medium' | 'fast' | 'medium-slow' | 'slow-then-very-fast' | 'fast-then-very-slow';

export type PokemonHabitat = 'cave' | 'forest' | 'grassland' | 'mountain' | 'rare' | 'rough-terrain' | 'sea' | 'urban' | 'waters-edge';

export type PokemonShape = 'ball' | 'squiggle' | 'fish' | 'arms' | 'blob' | 'upright' | 'legs' | 'quadruped' | 'wings' | 'tentacles' | 'heads' | 'humanoid' | 'bug-wings' | 'armor';

/**
 * Type guards for runtime type checking
 */
export function isPokemonSpecies(data: any): data is PokemonSpecies {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.base_happiness === 'number' &&
    typeof data.capture_rate === 'number' &&
    typeof data.gender_rate === 'number' &&
    typeof data.hatch_counter === 'number' &&
    typeof data.id === 'number' &&
    typeof data.name === 'string' &&
    typeof data.order === 'number' &&
    Array.isArray(data.egg_groups) &&
    Array.isArray(data.flavor_text_entries) &&
    Array.isArray(data.genera) &&
    Array.isArray(data.names) &&
    Array.isArray(data.pokedex_numbers) &&
    Array.isArray(data.varieties)
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
 * Helper functions for common Pokemon species operations
 */
export function getPokemonSpeciesName(pokemonSpecies: PokemonSpecies, language: string = 'en'): string {
  const nameEntry = pokemonSpecies.names.find(name => name.language.name === language);
  return nameEntry ? nameEntry.name : pokemonSpecies.name;
}

export function getPokemonSpeciesGenus(pokemonSpecies: PokemonSpecies, language: string = 'en'): string | null {
  const genusEntry = pokemonSpecies.genera.find(genus => genus.language.name === language);
  return genusEntry ? genusEntry.genus : null;
}

export function getPokemonSpeciesFlavorText(pokemonSpecies: PokemonSpecies, language: string = 'en', version?: string): string | null {
  let entries = pokemonSpecies.flavor_text_entries.filter(entry => entry.language.name === language);
  
  if (version) {
    entries = entries.filter(entry => entry.version.name === version);
  }
  
  // Return the most recent entry (usually the last one)
  return entries.length > 0 ? entries[entries.length - 1].flavor_text : null;
}

export function getPokemonSpeciesPokedexNumber(pokemonSpecies: PokemonSpecies, pokedexName: string = 'national'): number | null {
  const pokedexEntry = pokemonSpecies.pokedex_numbers.find(entry => entry.pokedex.name === pokedexName);
  return pokedexEntry ? pokedexEntry.entry_number : null;
}

export function getPokemonSpeciesEggGroups(pokemonSpecies: PokemonSpecies): string[] {
  return pokemonSpecies.egg_groups.map(group => group.name);
}

export function getPokemonSpeciesColor(pokemonSpecies: PokemonSpecies): string {
  return pokemonSpecies.color.name;
}

export function getPokemonSpeciesHabitat(pokemonSpecies: PokemonSpecies): string | null {
  return pokemonSpecies.habitat ? pokemonSpecies.habitat.name : null;
}

export function getPokemonSpeciesShape(pokemonSpecies: PokemonSpecies): string | null {
  return pokemonSpecies.shape ? pokemonSpecies.shape.name : null;
}

export function getPokemonSpeciesGrowthRate(pokemonSpecies: PokemonSpecies): string {
  return pokemonSpecies.growth_rate.name;
}

export function getPokemonSpeciesGeneration(pokemonSpecies: PokemonSpecies): string {
  return pokemonSpecies.generation.name;
}

export function isPokemonSpeciesLegendary(pokemonSpecies: PokemonSpecies): boolean {
  return pokemonSpecies.is_legendary;
}

export function isPokemonSpeciesMythical(pokemonSpecies: PokemonSpecies): boolean {
  return pokemonSpecies.is_mythical;
}

export function isPokemonSpeciesBaby(pokemonSpecies: PokemonSpecies): boolean {
  return pokemonSpecies.is_baby;
}

export function hasPokemonSpeciesGenderDifferences(pokemonSpecies: PokemonSpecies): boolean {
  return pokemonSpecies.has_gender_differences;
}

export function getPokemonSpeciesGenderRate(pokemonSpecies: PokemonSpecies): number {
  return pokemonSpecies.gender_rate;
}

export function getPokemonSpeciesCaptureRate(pokemonSpecies: PokemonSpecies): number {
  return pokemonSpecies.capture_rate;
}

export function getPokemonSpeciesBaseHappiness(pokemonSpecies: PokemonSpecies): number {
  return pokemonSpecies.base_happiness;
}

export function getPokemonSpeciesHatchCounter(pokemonSpecies: PokemonSpecies): number {
  return pokemonSpecies.hatch_counter;
}

export function getPokemonSpeciesVarieties(pokemonSpecies: PokemonSpecies): PokemonVariety[] {
  return pokemonSpecies.varieties;
}

export function getPokemonSpeciesDefaultVariety(pokemonSpecies: PokemonSpecies): PokemonVariety | null {
  return pokemonSpecies.varieties.find(variety => variety.is_default) || null;
}

/**
 * Constants for common Pokemon species data
 */
export const POKEMON_COLORS: Record<PokemonColor, string> = {
  black: '#2C2C2C',
  blue: '#3B82F6',
  brown: '#8B4513',
  gray: '#6B7280',
  green: '#10B981',
  pink: '#EC4899',
  purple: '#8B5CF6',
  red: '#EF4444',
  white: '#F3F4F6',
  yellow: '#F59E0B'
};

export const EGG_GROUPS: EggGroup[] = [
  'monster', 'water1', 'water2', 'water3', 'bug', 'flying', 'ground', 
  'fairy', 'plant', 'humanshape', 'mineral', 'indeterminate', 'ditto', 
  'dragon', 'no-eggs'
];

export const GROWTH_RATES: GrowthRate[] = [
  'slow', 'medium', 'fast', 'medium-slow', 'slow-then-very-fast', 'fast-then-very-slow'
];

export const POKEMON_HABITATS: PokemonHabitat[] = [
  'cave', 'forest', 'grassland', 'mountain', 'rare', 'rough-terrain', 
  'sea', 'urban', 'waters-edge'
];

export const POKEMON_SHAPES: PokemonShape[] = [
  'ball', 'squiggle', 'fish', 'arms', 'blob', 'upright', 'legs', 
  'quadruped', 'wings', 'tentacles', 'heads', 'humanoid', 'bug-wings', 'armor'
];

/**
 * Gender rate interpretation
 * -1: Genderless
 * 0: 100% Female
 * 1: 87.5% Male, 12.5% Female
 * 2: 75% Male, 25% Female
 * 3: 62.5% Male, 37.5% Female
 * 4: 50% Male, 50% Female
 * 5: 37.5% Male, 62.5% Female
 * 6: 25% Male, 75% Female
 * 7: 12.5% Male, 87.5% Female
 * 8: 100% Male
 */
export function interpretGenderRate(genderRate: number): { male: number; female: number; genderless: boolean } {
  if (genderRate === -1) {
    return { male: 0, female: 0, genderless: true };
  }
  
  const femalePercentage = (genderRate / 8) * 100;
  const malePercentage = 100 - femalePercentage;
  
  return {
    male: malePercentage,
    female: femalePercentage,
    genderless: false
  };
}
