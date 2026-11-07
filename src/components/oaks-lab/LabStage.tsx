'use client';

import { KeyboardEvent, ReactNode } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { dexDict } from '@/utils/pokemon/dicts';
import paper from '@/components/modals/paper.module.css';
import { spriteUrl } from './sprite';
import styles from './lab.module.css';

/** What the monitor and platform need to show a Pokémon, from a save slot or the Ranch */
export interface LabEntry {
    key: string;
    speciesIndex: number;
    nickname: string;
    level: number;
}

// ─── Layout ──────────────────────────────────────────────────────────────────

interface LabStageProps {
    panel: ReactNode;
    platform: ReactNode;
    monitor: ReactNode;
}

/** The action panel, the platform in the middle, and the monitor on the right */
export function LabStage({ panel, platform, monitor }: LabStageProps) {
    return (
        <div className={styles.stage}>
            <div className={styles.stagePanel}>{panel}</div>
            <div className={styles.stagePlatform}>{platform}</div>
            <div className={styles.stageMonitor}>{monitor}</div>
        </div>
    );
}

// ─── Platform ────────────────────────────────────────────────────────────────

const PLATFORM_MAX = 6;

interface PlatformProps {
    entries: LabEntry[];
    emptyText: string;
}

export function Platform({ entries, emptyText }: PlatformProps) {
    const shown = entries.slice(0, PLATFORM_MAX);
    const extra = entries.length - shown.length;
    const single = shown.length === 1 ? shown[0] : null;

    return (
        <div className={clsx(styles.platform, shown.length > 0 && styles.platformActive)}>
            <div className={styles.platformScene}>
                <div className={styles.beam} aria-hidden />
                <div
                    className={clsx(styles.platformMons, shown.length > 1 && styles.platformGroup)}
                    data-count={shown.length}
                >
                    {shown.map((e, i) => {
                        const sprite = spriteUrl(e.speciesIndex);
                        return (
                            <div
                                key={e.key}
                                className={styles.platformMon}
                                style={{ animationDelay: `${i * -0.35}s` }}
                            >
                                {sprite && (
                                    <Image
                                        src={sprite}
                                        alt={e.nickname}
                                        width={single ? 128 : 72}
                                        height={single ? 128 : 72}
                                        className={styles.platformSprite}
                                        unoptimized
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className={styles.pad} aria-hidden>
                    <div className={styles.padBase} />
                    <div className={styles.padTop} />
                    <div className={styles.padGlow} />
                </div>
            </div>

            <div className={styles.nameplate} aria-live="polite">
                {single ? (
                    <>
                        <span className={styles.nameplateName}>{single.nickname}</span>
                        <span className={styles.nameplateMeta}>
                            {dexDict[single.speciesIndex]?.name} · Lv. {single.level}
                        </span>
                    </>
                ) : shown.length > 1 ? (
                    <span className={styles.nameplateName}>
                        {entries.length} Pokémon{extra > 0 ? ` (+${extra} more)` : ''}
                    </span>
                ) : (
                    <span className={styles.nameplateEmpty}>{emptyText}</span>
                )}
            </div>
        </div>
    );
}

// ─── Monitor ─────────────────────────────────────────────────────────────────

interface MonitorProps {
    /** Screen heading, such as "Party" or "Box 3" */
    title: string;
    /** Shown at the right of the heading, such as "4/6" */
    meta?: string;
    entries: LabEntry[];
    cursorKey: string;
    markedKeys?: Set<string>;
    /** A click or Enter on a Pokémon */
    onPick: (entry: LabEntry) => void;
    /** The arrows moved to a Pokémon */
    onCursor: (entry: LabEntry) => void;
    /** Moves between pages, such as the party and each box. Hidden when left out. */
    pages?: { label: string; onPrev: () => void; onNext: () => void; disabled?: boolean };
    /** The round button under the screen, acting on the Pokémon at the cursor */
    action?: { label: string; onClick: () => void; disabled?: boolean };
    /** Replaces the grid, for loading and setup screens */
    screen?: ReactNode;
    emptyText?: string;
    footnote?: ReactNode;
}

export function Monitor({
    title, meta, entries, cursorKey, markedKeys, onPick, onCursor,
    pages, action, screen, emptyText = 'Empty', footnote,
}: MonitorProps) {
    const index = entries.findIndex(e => e.key === cursorKey);
    const canStep = !screen && entries.length > 0;

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

                <div className={styles.screenBody}>
                    {screen ? (
                        <div className={styles.screenMessage}>{screen}</div>
                    ) : entries.length === 0 ? (
                        <div className={styles.screenMessage}><p>{emptyText}</p></div>
                    ) : (
                        <div
                            className={styles.screenGrid}
                            role="listbox"
                            aria-label={title}
                            aria-multiselectable={!!markedKeys}
                            tabIndex={0}
                            onKeyDown={handleKey}
                        >
                            {entries.map(e => {
                                const sprite = spriteUrl(e.speciesIndex);
                                const marked = markedKeys?.has(e.key) ?? false;
                                const atCursor = e.key === cursorKey;
                                return (
                                    <div
                                        key={e.key}
                                        role="option"
                                        aria-selected={markedKeys ? marked : atCursor}
                                        className={clsx(
                                            styles.tile,
                                            atCursor && styles.tileCursor,
                                            marked && styles.tileMarked,
                                        )}
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

                {footnote && <div className={styles.screenFootnote}>{footnote}</div>}
            </div>

            <div className={styles.monitorControls}>
                {pages ? (
                    <div className={styles.rocker}>
                        <button
                            type="button"
                            className={styles.rockerBtn}
                            onClick={pages.onPrev}
                            disabled={pages.disabled}
                            aria-label={`Previous page (now ${pages.label})`}
                            title="Previous page"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            type="button"
                            className={styles.rockerBtn}
                            onClick={pages.onNext}
                            disabled={pages.disabled}
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
                        onClick={() => step(-1)}
                        disabled={!canStep}
                        aria-label="Previous Pokémon"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        type="button"
                        className={styles.dpadBtn}
                        onClick={() => step(1)}
                        disabled={!canStep}
                        aria-label="Next Pokémon"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {action ? (
                    <div className={styles.actionWrap}>
                        <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={action.onClick}
                            disabled={action.disabled}
                            aria-label={action.label}
                            title={action.label}
                        />
                    </div>
                ) : <span />}
            </div>
        </section>
    );
}

// ─── Panel ───────────────────────────────────────────────────────────────────

/** The paper card on the left, for whatever the current mode does */
export function LabPanel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className={clsx(paper.modalContent, paper.paperModal, styles.panel)}>
            <h2 className={styles.panelTitle}>{title}</h2>
            {children}
        </section>
    );
}
