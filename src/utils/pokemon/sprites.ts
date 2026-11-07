import { pokemonGifEndpoint, pokemonStadiumGifEndpoint } from '@/../config';
import { dexDict } from '@/utils/pokemon/dicts';

export type SpriteSource = 'gameboy' | 'stadium';

export const spriteSourceOptions: { value: SpriteSource; label: string }[] = [
    { value: 'gameboy', label: 'Game Boy' },
    { value: 'stadium', label: 'Stadium' },
];

const endpoints: Record<SpriteSource, string> = {
    gameboy: pokemonGifEndpoint,
    stadium: pokemonStadiumGifEndpoint,
};

/** Only the Game Boy sprites are pixel art; the Stadium renders should be smoothed when scaled */
export const isPixelArt = (source: SpriteSource) => source === 'gameboy';

/** GIF for a National Dex number, e.g. '025' */
export function pokemonGifUrl(pokedexNo: string, source: SpriteSource): string {
    return `${endpoints[source]}${pokedexNo.padStart(3, '0')}.gif`;
}

/** GIF for an internal Gen 1 species index, or '' when it has no Pokédex entry */
export function speciesGifUrl(speciesIndex: number, source: SpriteSource): string {
    const entry = dexDict[speciesIndex];
    if (!entry || entry.pokedexNo === 'NULL') return '';
    return pokemonGifUrl(entry.pokedexNo, source);
}
