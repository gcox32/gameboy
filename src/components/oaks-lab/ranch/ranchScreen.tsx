'use client';

import clsx from 'clsx';
import type { RanchPokemon } from '@/components/ranch/types';
import { LabEntry, MonitorScreen } from '../stage';
import type { LabRanch } from './useLabRanch';
import styles from '../lab.module.css';

/** Keys for Ranch Pokémon, kept apart from save slots' keys */
export const ranchKey = (id: string) => `ranch-${id}`;

export const ranchEntry = (p: RanchPokemon): LabEntry => ({
    key: ranchKey(p.id),
    speciesIndex: p.speciesIndex,
    nickname: p.nickname,
    level: p.level,
});

/** Every pen along the bottom of the screen, with the one on screen filled in */
function PenMap({ ranch }: { ranch: LabRanch }) {
    if (ranch.pens.length < 2) return null;
    return (
        <div className={styles.pageMap} role="img" aria-label={`Showing ${ranch.pen?.name} of ${ranch.pens.length} pens`}>
            {ranch.pens.map(p => (
                <span key={p.id} className={clsx(styles.pageMarker, p.id === ranch.pen?.id && styles.pageMarkerCurrent)} />
            ))}
        </div>
    );
}

interface RanchScreenHandlers {
    cursorKey: string;
    onPick: (p: RanchPokemon) => void;
    onCursor: (p: RanchPokemon) => void;
}

/** The Ranch, a pen at a time, as the monitor's screen shows it */
export function ranchScreen(ranch: LabRanch, { cursorKey, onPick, onCursor }: RanchScreenHandlers): MonitorScreen {
    const { pen, penSlots, capacity } = ranch;
    const byKey = new Map(penSlots.map(p => [ranchKey(p.id), p]));
    const fromEntry = (handler: (p: RanchPokemon) => void) => (e: LabEntry) => {
        const p = byKey.get(e.key);
        if (p) handler(p);
    };

    const message = ranch.error ? <p>{ranch.error}</p> : null;
    const label = pen?.name ?? 'Ranch';

    return {
        title: message || ranch.loading ? 'Oak’s Ranch' : label,
        meta: message || ranch.loading ? undefined : `${penSlots.length}/${capacity}`,
        entries: penSlots.map(ranchEntry),
        cursorKey,
        onPick: fromEntry(onPick),
        onCursor: fromEntry(onCursor),
        pages: {
            label,
            onPrev: () => ranch.stepPen(-1),
            onNext: () => ranch.stepPen(1),
            inactive: ranch.pens.length < 2,
        },
        screen: message,
        loading: ranch.loading,
        emptyText: ranch.pokemon.length ? 'This pen is empty.' : 'No Pokémon at the Ranch.',
        pageMap: !ranch.loading && !message ? <PenMap ranch={ranch} /> : null,
    };
}
