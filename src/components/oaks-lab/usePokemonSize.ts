'use client';

import { useEffect, useState } from 'react';
import { dexDict } from '@/utils/pokemon/dicts';

/** As PokéAPI gives them: height in decimetres, weight in hectograms */
export interface PokemonSize {
    height: number;
    weight: number;
}

/** Sizes by Pokédex number, or null when PokéAPI couldn't say. Lives for the session. */
const sizes = new Map<number, PokemonSize | null>();
const pending = new Map<number, Promise<PokemonSize | null>>();

function fetchSize(dexNo: number): Promise<PokemonSize | null> {
    let p = pending.get(dexNo);
    if (!p) {
        p = fetch(`/api/pokeapi/pokemon/${dexNo}/size`)
            .then(res => (res.ok ? res.json() : null))
            .then((data: Partial<PokemonSize> | null) =>
                typeof data?.height === 'number' && typeof data.weight === 'number'
                    ? { height: data.height, weight: data.weight }
                    : null)
            .catch(() => null)
            .then(size => {
                sizes.set(dexNo, size);
                // Let a failure be retried on the next selection
                if (size === null) pending.delete(dexNo);
                return size;
            });
        pending.set(dexNo, p);
    }
    return p;
}

export function dexNoOf(speciesIndex: number): number | null {
    const no = Number(dexDict[speciesIndex]?.pokedexNo);
    return Number.isInteger(no) && no > 0 ? no : null;
}

/**
 * The sizes of these species, from game data's species index to Pokédex number to PokéAPI.
 * `ready` is false until every one has been answered, found or not.
 */
export function usePokemonSizes(speciesIndexes: number[]) {
    const dexNos = speciesIndexes.map(dexNoOf).filter((n): n is number => n !== null);
    const key = dexNos.join(',');
    const [, setVersion] = useState(0);

    useEffect(() => {
        const missing = key ? key.split(',').map(Number).filter(n => !sizes.has(n)) : [];
        if (missing.length === 0) return;
        let live = true;
        Promise.all(missing.map(fetchSize)).then(() => {
            if (live) setVersion(v => v + 1);
        });
        return () => { live = false; };
    }, [key]);

    return {
        ready: dexNos.every(n => sizes.has(n)),
        sizeOf: (speciesIndex: number): PokemonSize | null => {
            const n = dexNoOf(speciesIndex);
            return n === null ? null : sizes.get(n) ?? null;
        },
    };
}
