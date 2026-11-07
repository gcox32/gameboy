import type { PokemonDetails } from '@/types/pokemon';
import { parseBoxStructure } from '@/utils/pokemon/parse';
import { calcGen1Stats } from '@/utils/pokemon/stats';
import { RanchPokemon, getRawBytes } from './types';

/**
 * A Ranch Pokémon in the shape the party's details card takes. A boxed Pokémon has no
 * party stats, so they're worked out from its level, IVs and stat exp as the game would.
 * Its moves carry the details kept from the game it came from, where there are any.
 */
export function toPokemonDetails(p: RanchPokemon): PokemonDetails {
    const bytes = getRawBytes(p.rawBoxData);
    const box = parseBoxStructure(bytes);
    const known = new Map((p.moves ?? []).map(({ id, ...details }) => [id, details]));

    return {
        speciesIndex: p.speciesIndex,
        pokedexNo: box.pokedexNo ?? '',
        speciesName: p.speciesName,
        nickname: p.nickname,
        otName: p.otName,
        structure: {
            ...box,
            level: p.level,
            levelStats: calcGen1Stats(bytes),
            moves: box.moves.map(m => ({ ...m, details: known.get(m.id) })),
        },
    };
}
