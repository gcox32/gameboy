import { spriteUrl, type SpriteSet } from '@/lib/assets';
import { dexDict } from '@/utils/pokemon/dicts';

/** Stored in settings, so the ids stay as they were when the sets were first named */
export type SpriteSource = 'gameboy' | 'stadium';

export const spriteSourceOptions: { value: SpriteSource; label: string }[] = [
    { value: 'gameboy', label: 'Game Boy' },
    { value: 'stadium', label: 'Stadium' },
];

const spriteSets: Record<SpriteSource, SpriteSet> = {
    gameboy: '3ds',
    stadium: 'stadium',
};

/** Only the Game Boy sprites are pixel art; the Stadium renders should be smoothed when scaled */
export const isPixelArt = (source: SpriteSource) => source === 'gameboy';

/** GIF for a National Dex number, e.g. '025' */
export function pokemonGifUrl(pokedexNo: string, source: SpriteSource): string {
    return spriteUrl(pokedexNo, spriteSets[source]);
}

/** GIF for an internal Gen 1 species index, or '' when it has no Pokédex entry */
export function speciesGifUrl(speciesIndex: number, source: SpriteSource): string {
    const entry = dexDict[speciesIndex];
    if (!entry || entry.pokedexNo === 'NULL') return '';
    return pokemonGifUrl(entry.pokedexNo, source);
}
