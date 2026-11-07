'use client';

import { KeyboardEvent, ReactNode } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { press } from './press';
import { spriteUrl } from './sprite';
import type { LabEntry } from './types';
import styles from '../lab.module.css';

interface MonitorProps {
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
    /** Moves between pages, such as the party and each box. Hidden when left out. */
    pages?: { label: string; onPrev: () => void; onNext: () => void; inactive?: boolean };
    /** Replaces the grid, for setup screens and errors */
    screen?: ReactNode;
    /** Blanks the screen and holds the static on until whatever it shows has arrived */
    loading?: boolean;
    emptyText?: string;
    footnote?: ReactNode;
}

export function Monitor({
    title, meta, entries, cursorKey, onPick, onCursor,
    pages, screen, loading = false, emptyText = 'Empty', footnote,
}: MonitorProps) {
    const index = entries.findIndex(e => e.key === cursorKey);
    const canStep = !loading && !screen && entries.length > 0;

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
                                const sprite = spriteUrl(e.speciesIndex);
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
                {/* Snow while the Lab changes mode, and while there's nothing to show yet */}
                <div className={clsx(styles.static, loading && styles.staticOn)} aria-hidden />
            </div>

            <div className={styles.monitorControls}>
                {pages ? (
                    <div className={styles.rocker}>
                        <button
                            type="button"
                            className={styles.rockerBtn}
                            {...press(pages.inactive, pages.onPrev)}
                            aria-label={`Previous page (now ${pages.label})`}
                            title="Previous page"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            type="button"
                            className={styles.rockerBtn}
                            {...press(pages.inactive, pages.onNext)}
                            aria-label={`Next page (now ${pages.label})`}
                            title="Next page"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                ) : <span />}

                <div className={styles.dpad}>
                    <button
                        type="button"
                        className={styles.dpadBtn}
                        {...press(!canStep, () => step(-1))}
                        aria-label="Previous Pokémon"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        type="button"
                        className={styles.dpadBtn}
                        {...press(!canStep, () => step(1))}
                        aria-label="Next Pokémon"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </section>
    );
}
