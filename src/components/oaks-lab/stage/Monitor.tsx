'use client';

import { KeyboardEvent, ReactNode } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { press } from './press';
import { SlideSwitch } from './SlideSwitch';
import { usePokemonSprites } from '@/hooks/usePokemonSprites';
import type { LabEntry } from './types';
import styles from '../lab.module.css';

/** What the monitor can show. Its switch is printed with these, so they're part of the hardware. */
export type MonitorSource = 'save' | 'ranch';

const SOURCES: { id: MonitorSource; label: string }[] = [
    { id: 'save', label: 'Save' },
    { id: 'ranch', label: 'Ranch' },
];

/** What's on the screen. Everything else about the monitor is hardware and never changes. */
export interface MonitorScreen {
    /** Screen heading, such as "Party" or "Box 3" */
    title: string;
    /** Shown at the right of the heading, such as "4/6" */
    meta?: string;
    entries: LabEntry[];
    /** The selected Pokémon, which the arrows move */
    cursorKey: string;
    /** A click or Enter on a Pokémon */
    onPick: (entry: LabEntry) => void;
    /** The arrows moved to a Pokémon */
    onCursor: (entry: LabEntry) => void;
    /** Moves between pages, such as the party and each box. Left out, the rocker does nothing. */
    pages?: { label: string; onPrev: () => void; onNext: () => void; inactive?: boolean };
    /** Replaces the grid, for setup screens and errors */
    screen?: ReactNode;
    /**
     * For a "press any button" screen: every one of the monitor's buttons does this instead of
     * its usual job. Screens never carry buttons of their own. The input switch still switches.
     */
    onAnyButton?: () => void;
    /** Blanks the screen and holds the static on until whatever it shows has arrived */
    loading?: boolean;
    emptyText?: string;
    footnote?: ReactNode;
    /** Along the bottom of the screen, such as a map of the save's pages */
    pageMap?: ReactNode;
}

interface MonitorProps extends MonitorScreen {
    /** Where the input switch is */
    source: MonitorSource;
    /** The switch always moves. A source the mode has nothing for shows static (see FedMonitor). */
    onSourceChange: (source: MonitorSource) => void;
}

export function Monitor({
    title, meta, entries, cursorKey, onPick, onCursor,
    pages, screen, onAnyButton, loading = false, emptyText = 'Empty', footnote, pageMap, source, onSourceChange,
}: MonitorProps) {
    const { bySpecies, spriteStyle } = usePokemonSprites();
    const index = entries.findIndex(e => e.key === cursorKey);
    const canStep = !loading && !screen && entries.length > 0;

    // Only while the prompt is actually on screen, not under the snow
    const anyButton = loading ? undefined : onAnyButton;
    const control = (inactive: boolean | undefined, action: () => void) =>
        anyButton ? press(false, anyButton) : press(inactive, action);

    const step = (by: number) => {
        if (!canStep) return;
        const from = index < 0 ? (by > 0 ? -1 : 0) : index;
        onCursor(entries[(from + by + entries.length) % entries.length]);
    };

    const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
        else if (e.key === 'Enter' && index >= 0) { e.preventDefault(); onPick(entries[index]); }
    };

    return (
        <section className={styles.monitor} aria-label={`${title} monitor`}>
            <div className={styles.monitorTop} aria-hidden>
                <span className={styles.monitorLed} />
                <span className={styles.monitorVents} />
            </div>

            <div className={styles.screen}>
                <div className={styles.screenHeader}>
                    <span>{title}</span>
                    {meta && <span>{meta}</span>}
                </div>

                <div className={styles.screenBody} aria-busy={loading}>
                    {loading ? null : screen ? (
                        <div className={styles.screenMessage}>{screen}</div>
                    ) : entries.length === 0 ? (
                        <div className={styles.screenMessage}><p>{emptyText}</p></div>
                    ) : (
                        <div
                            className={styles.screenGrid}
                            role="listbox"
                            aria-label={title}
                            tabIndex={0}
                            onKeyDown={handleKey}
                        >
                            {entries.map(e => {
                                const sprite = bySpecies(e.speciesIndex);
                                const atCursor = e.key === cursorKey;
                                return (
                                    <div
                                        key={e.key}
                                        role="option"
                                        aria-selected={atCursor}
                                        className={clsx(styles.tile, atCursor && styles.tileCursor)}
                                        onClick={() => onPick(e)}
                                    >
                                        {sprite && (
                                            <Image
                                                src={sprite}
                                                alt=""
                                                width={56}
                                                height={56}
                                                className={styles.tileSprite}
                                                style={spriteStyle}
                                                unoptimized
                                            />
                                        )}
                                        <span className={styles.tileName}>{e.nickname}</span>
                                        <span className={styles.tileLevel}>Lv. {e.level}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {!loading && footnote && <div className={styles.screenFootnote}>{footnote}</div>}
                {!loading && pageMap}
                {/* Snow while the Lab changes mode, and while there's nothing to show yet */}
                <div className={clsx(styles.static, loading && styles.staticOn)} aria-hidden />
            </div>

            <div className={styles.monitorControls}>
                <div className={styles.rocker}>
                    <button
                        type="button"
                        className={styles.rockerBtn}
                        {...control(!pages || pages.inactive, () => pages?.onPrev())}
                        aria-label={pages ? `Previous page (now ${pages.label})` : 'Previous page'}
                        title="Previous page"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        type="button"
                        className={styles.rockerBtn}
                        {...control(!pages || pages.inactive, () => pages?.onNext())}
                        aria-label={pages ? `Next page (now ${pages.label})` : 'Next page'}
                        title="Next page"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>

                <div className={styles.dpad}>
                    <button
                        type="button"
                        className={styles.dpadBtn}
                        {...control(!canStep, () => step(-1))}
                        aria-label="Previous Pokémon"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        type="button"
                        className={styles.dpadBtn}
                        {...control(!canStep, () => step(1))}
                        aria-label="Next Pokémon"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className={styles.monitorInput}>
                    <SlideSwitch
                        small
                        printed
                        label="Monitor input"
                        options={SOURCES}
                        value={source}
                        onChange={onSourceChange}
                    />
                </div>
            </div>
        </section>
    );
}
