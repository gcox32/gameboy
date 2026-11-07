'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RanchData, RanchPokemon } from '@/components/ranch/types';

/**
 * The Ranch as the Lab's monitor shows it: one pen per page, as a save shows one box.
 * Loads when first asked for, so a Lab that never looks at the Ranch never fetches it.
 */
export function useLabRanch(active: boolean) {
    const [data, setData] = useState<RanchData | null>(null);
    const [error, setError] = useState('');
    const [penId, setPenId] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch('/api/ranch');
            if (!res.ok) throw new Error();
            setData(await res.json());
            setError('');
        } catch {
            setError('Couldn\'t reach the Ranch.');
        }
    }, []);

    const wanted = active && !data && !error;
    useEffect(() => {
        if (wanted) refresh();
    }, [wanted, refresh]);

    const pens = useMemo(() => data?.pens ?? [], [data]);
    const pen = pens.find(p => p.id === penId) ?? pens[0] ?? null;
    const penSlots = useMemo(
        () => (data?.pokemon ?? []).filter(p => p.penId === pen?.id),
        [data, pen],
    );

    const stepPen = (by: number) => {
        if (!pens.length || !pen) return;
        const at = pens.indexOf(pen);
        setPenId(pens[(at + by + pens.length) % pens.length].id);
    };

    /** Turns to the pen this Pokémon is in */
    const showPenOf = useCallback((id: string) => {
        const mon = data?.pokemon.find(p => p.id === id);
        if (mon?.penId) setPenId(mon.penId);
    }, [data]);

    /** Puts a changed record in place, as the server returned it */
    const replace = (updated: RanchPokemon) =>
        setData(d => d && { ...d, pokemon: d.pokemon.map(p => (p.id === updated.id ? updated : p)) });

    return {
        loading: !data && !error,
        error,
        capacity: data?.capacity ?? 0,
        pokemon: data?.pokemon ?? [],
        pens,
        pen,
        /** The Pokémon in the pen on the monitor */
        penSlots,
        stepPen,
        setPenId,
        showPenOf,
        replace,
        refresh,
    };
}

export type LabRanch = ReturnType<typeof useLabRanch>;
