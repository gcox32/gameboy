import { CSSProperties, useMemo } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { isPixelArt, pokemonGifUrl, speciesGifUrl } from '@/utils/pokemon/sprites';

/** Pokémon GIFs from the sprite set chosen in Settings */
export function usePokemonSprites() {
    const { spriteSource } = useSettings().uiSettings;

    return useMemo(() => ({
        spriteSource,
        byDexNo: (pokedexNo: string) => pokemonGifUrl(pokedexNo, spriteSource),
        bySpecies: (speciesIndex: number) => speciesGifUrl(speciesIndex, spriteSource),
        /** Keeps pixel art crisp when scaled and lets the smooth renders smooth */
        spriteStyle: { imageRendering: isPixelArt(spriteSource) ? 'pixelated' : 'auto' } as CSSProperties,
    }), [spriteSource]);
}
