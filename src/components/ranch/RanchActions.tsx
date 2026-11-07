'use client';

import { useState } from 'react';
import Link from 'next/link';
import { enhanceAtRanchHref } from '@/components/oaks-lab/links';
import type { RanchPen, RanchPokemon } from './types';
import styles from './styles.module.css';

interface RanchActionsProps {
    pokemon: RanchPokemon;
    pens: RanchPen[];
    capacity: number;
    countOf: (penId: string) => number;
    onMove: (penId: string) => Promise<void>;
    /** Resolves true once the Pokémon is really gone */
    onRelease: () => Promise<boolean>;
}

/** What can be done with a Ranch Pokémon, shown on its details card */
export function RanchActions({ pokemon, pens, capacity, countOf, onMove, onRelease }: RanchActionsProps) {
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);

    const handleRelease = async () => {
        if (!confirming) { setConfirming(true); return; }
        setBusy(true);
        const released = await onRelease();
        // Gone means the card is closing
        if (!released) { setBusy(false); setConfirming(false); }
    };

    const handleMove = async (penId: string) => {
        setBusy(true);
        await onMove(penId);
        setBusy(false);
    };

    return (
        <>
            {pens.length > 1 && (
                <label className={styles.moveTo}>
                    <span>Move to</span>
                    <select
                        value=""
                        disabled={busy}
                        onChange={e => e.target.value && handleMove(e.target.value)}
                    >
                        <option value="">Pen…</option>
                        {pens.filter(p => p.id !== pokemon.penId).map(p => {
                            const full = countOf(p.id) >= capacity;
                            return (
                                <option key={p.id} value={p.id} disabled={full}>
                                    {p.name} ({countOf(p.id)}/{capacity}){full ? ' full' : ''}
                                </option>
                            );
                        })}
                    </select>
                </label>
            )}
            {/* Edited at the Lab, where it stays at the Ranch */}
            <Link href={enhanceAtRanchHref(pokemon.id)} className={styles.enhanceBtn}>
                Enhance
            </Link>
            <button
                type="button"
                className={styles.releaseBtn}
                onClick={handleRelease}
                onBlur={() => !busy && setConfirming(false)}
                disabled={busy}
            >
                {busy && confirming ? 'Releasing...' : confirming ? 'Confirm release?' : 'Release'}
            </button>
        </>
    );
}
