'use client';

import { CSSProperties, KeyboardEvent, ReactNode, useRef } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { spriteUrl } from './sprite';
import { usePokemonSizes, type PokemonSize } from './usePokemonSize';
import styles from './lab.module.css';

/**
 * Buttons in the Lab never look disabled. One with nothing to do still presses like the
 * others and simply does nothing, the way a real console button would. Screen readers are
 * told it's unavailable.
 */
export function press(inactive: boolean | undefined, onClick: () => void) {
    return {
        'aria-disabled': inactive || undefined,
        onClick: inactive ? undefined : onClick,
    };
}

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

/*
 * A Pokémon's height on the pad, as a share of the pad scene's width. Real heights in Gen 1 run
 * from 0.2 m (Diglett) to 8.8 m (Onix): true to scale would make Onix 44 Diglett tall. So sizes
 * are exactly proportional up to GIANT_FROM_M, which covers nearly everyone, and only the giants
 * above it are compressed. The sprites fill their canvas, so the image height is the Pokémon's.
 */
const SCALE_PER_M = 0.65;
const GIANT_FROM_M = 1.5;
/** How hard the giants are compressed: 1 would be true to scale, 0 would make them all equal */
const GIANT_CURVE = 0.35;
/** Keeps the very smallest from vanishing */
const SCALE_MIN = 0.1;
/** Size for a Pokémon whose height PokéAPI couldn't give */
const SCALE_UNKNOWN = SCALE_PER_M;
/** Several on the pad at once stand smaller, so they fit side by side */
const GROUP_SCALE = 0.6;

function spriteScale(heightDm: number | null, group: boolean): number {
    let base = SCALE_UNKNOWN;
    if (heightDm) {
        const m = heightDm / 10;
        base = m <= GIANT_FROM_M
            ? SCALE_PER_M * m
            : SCALE_PER_M * GIANT_FROM_M * (m / GIANT_FROM_M) ** GIANT_CURVE;
        base = Math.max(SCALE_MIN, base);
    }
    return group ? base * GROUP_SCALE : base;
}

/** "1.7 m · 90.5 kg", from PokéAPI's decimetres and hectograms */
function formatSize({ height, weight }: PokemonSize): string {
    return `${height / 10} m · ${weight / 10} kg`;
}

interface PlatformProps {
    entries: LabEntry[];
}

/** The pad in the middle of the Lab. It's part of the room, so it never moves; Pokémon appear on it. */
export function Platform({ entries }: PlatformProps) {
    const shown = entries.slice(0, PLATFORM_MAX);
    const group = shown.length > 1;
    // Hold the sprites back until their sizes are known, so they appear at their size and don't jump
    const { ready, sizeOf } = usePokemonSizes(shown.map(e => e.speciesIndex));
    const singleSize = ready && shown.length === 1 ? sizeOf(shown[0].speciesIndex) : null;

    return (
        <div className={clsx(styles.platform, shown.length > 0 && styles.platformActive)}>
            <div className={styles.platformScene}>
                <div className={styles.beam} aria-hidden />
                <div
                    className={clsx(styles.platformMons, group && styles.platformGroup)}
                    data-count={shown.length}
                >
                    {ready && shown.map((e, i) => {
                        const sprite = spriteUrl(e.speciesIndex);
                        const size = sizeOf(e.speciesIndex);
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
                                        width={128}
                                        height={128}
                                        title={size ? `${e.nickname}: ${formatSize(size)}` : e.nickname}
                                        className={styles.platformSprite}
                                        style={{ '--mon-scale': spriteScale(size?.height ?? null, group) } as CSSProperties}
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
                {/* Size readout, for testing. Out of the flow, so it can't move the pad. Groups show theirs on hover. */}
                {singleSize && <div className={styles.platformSize}>{formatSize(singleSize)}</div>}
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
    pages?: { label: string; onPrev: () => void; onNext: () => void; inactive?: boolean };
    /** The round button under the screen, acting on the Pokémon at the cursor */
    action?: { label: string; onClick: () => void; inactive?: boolean };
    /** Replaces the grid, for setup screens and errors */
    screen?: ReactNode;
    /** Blanks the screen and holds the static on until whatever it shows has arrived */
    loading?: boolean;
    emptyText?: string;
    footnote?: ReactNode;
}

export function Monitor({
    title, meta, entries, cursorKey, markedKeys, onPick, onCursor,
    pages, action, screen, loading = false, emptyText = 'Empty', footnote,
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

                {action ? (
                    <div className={styles.actionWrap}>
                        <button
                            type="button"
                            className={styles.actionBtn}
                            {...press(action.inactive, action.onClick)}
                            aria-label={action.label}
                            title={action.label}
                        />
                    </div>
                ) : <span />}
            </div>
        </section>
    );
}

// ─── Slide switch ────────────────────────────────────────────────────────────

interface SlideSwitchProps<T extends string> {
    label: string;
    options: { id: T; label: string; inactive?: boolean }[];
    value: T;
    onChange: (value: T) => void;
    /** Narrower positions, for the decks */
    small?: boolean;
}

/** A slide switch with a light over each position, so it's plain only one is on */
export function SlideSwitch<T extends string>({ label, options, value, onChange, small }: SlideSwitchProps<T>) {
    const index = Math.max(options.findIndex(o => o.id === value), 0);
    const refs = useRef<(HTMLButtonElement | null)[]>([]);

    const handleKey = (e: KeyboardEvent) => {
        const by = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
            : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!by) return;
        e.preventDefault();
        for (let i = index + by; i >= 0 && i < options.length; i += by) {
            if (options[i].inactive) continue;
            onChange(options[i].id);
            refs.current[i]?.focus();
            return;
        }
    };

    return (
        <div
            className={clsx(styles.switch, small && styles.switchSmall)}
            role="radiogroup"
            aria-label={label}
            onKeyDown={handleKey}
            style={{ '--stops': options.length } as CSSProperties}
        >
            <div className={styles.track} aria-hidden>
                <span className={styles.thumb} style={{ transform: `translateX(${index * 100}%)` }} />
            </div>
            {options.map((o, i) => (
                <button
                    key={o.id}
                    ref={el => { refs.current[i] = el; }}
                    type="button"
                    role="radio"
                    aria-checked={value === o.id}
                    aria-label={o.label}
                    title={o.label}
                    tabIndex={value === o.id ? 0 : -1}
                    className={styles.stop}
                    style={{ gridColumn: i + 1 }}
                    {...press(o.inactive, () => onChange(o.id))}
                >
                    <i className={clsx(styles.lamp, value === o.id ? styles.lamp_on : styles.lamp_off)} aria-hidden />
                </button>
            ))}
        </div>
    );
}

// ─── Deck ────────────────────────────────────────────────────────────────────

interface LabDeckProps {
    title: string;
    /** What the deck's screen shows */
    children: ReactNode;
    /** The hardware under the screen */
    controls?: ReactNode;
}

/** The upright deck on the left, which slides in for whichever mode is on */
export function LabDeck({ title, children, controls }: LabDeckProps) {
    return (
        <section className={styles.deck} aria-label={title}>
            <div className={styles.monitorTop} aria-hidden>
                <span className={styles.monitorLed} />
                <span className={styles.monitorVents} />
            </div>
            <div className={clsx(styles.screen, styles.deckScreen)}>
                <div className={styles.screenHeader}><span>{title}</span></div>
                <div className={styles.deckBody}>{children}</div>
            </div>
            {controls && <div className={styles.deckControls}>{controls}</div>}
        </section>
    );
}

interface DeckKeyProps {
    label: string;
    onClick: () => void;
    /** Nothing to do right now: it still presses, but does nothing */
    inactive?: boolean;
    /** 'alt' is steel blue, for a second action beside the main one */
    tone?: 'main' | 'alt';
    children: ReactNode;
}

/** The deck's main action: a chunky key with only an icon on it */
export function DeckKey({ label, onClick, inactive, tone = 'main', children }: DeckKeyProps) {
    return (
        <button
            type="button"
            className={clsx(styles.deckKey, tone === 'alt' && styles.deckKeyAlt)}
            {...press(inactive, onClick)}
            aria-label={label}
            title={label}
        >
            {children}
        </button>
    );
}

/** A small grey pill, for lesser actions like Reset */
export function DeckPill({ label, onClick, inactive, children }: DeckKeyProps) {
    return (
        <button
            type="button"
            className={styles.pill}
            {...press(inactive, onClick)}
            aria-label={label}
            title={label}
        >
            {children}
        </button>
    );
}
