import { pokemonGifEndpoint } from '../../../../config';
import { dexDict } from '@/utils/pokemon/dicts';

export function spriteUrl(speciesIndex: number): string {
    const entry = dexDict[speciesIndex];
    if (!entry || entry.pokedexNo === 'NULL') return '';
    return `${pokemonGifEndpoint}${entry.pokedexNo.padStart(3, '0')}.gif`;
}
