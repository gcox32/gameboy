'use client';

import { CSSProperties, MouseEvent, PointerEvent, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { RotateCcw, Save } from 'lucide-react';
import { dexDict } from '@/utils/pokemon/dicts';
import { Gen1IVs, MAX_IV, StoredIVs, hpIVFrom } from '@/utils/pokemon/stats';
import { DeckAck, DeckBusy, DeckKey, DeckPill, DeckResult, LabResult } from '../stage';
import lab from '../lab.module.css';
import styles from './ivEditor.module.css';

const RAISABLE: { key: keyof StoredIVs; label: string }[] = [
    { key: 'attack', label: 'Attack' },
    { key: 'defense', label: 'Defense' },
    { key: 'speed', label: 'Speed' },
    { key: 'special', label: 'Special' },
];

const NO_IVS: StoredIVs = { attack: 0, defense: 0, speed: 0, special: 0 };

/** How long a press is held before the dial starts turning by itself, then how often it clicks */
const HOLD_DELAY_MS = 400;
const HOLD_STEP_MS = 120;

function Gauge({ label, saved, value }: { label: string; saved: number; value: number }) {
    return (
        <div
            className={styles.gauge}
            role="meter"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={MAX_IV}
            aria-valuenow={value}
        >
            {Array.from({ length: MAX_IV }, (_, i) => {
                const filled = i < value;
                const wasFilled = i < saved;
                return (
                    <span
                        key={i}
                        className={clsx(
                            styles.segment,
                            filled && wasFilled && styles.segmentFilled,
                            filled && !wasFilled && styles.segmentRaised,
                            !filled && wasFilled && styles.segmentLowered,
                        )}
                    />
                );
            })}
        </div>
    );
}

interface DialProps {
    label: string;
    value: number;
    saved: number;
    /** Nothing to turn: it still presses, but does nothing */
    inactive: boolean;
    onRaise: () => void;
}

/** A knob that only turns up: a click is one notch, and holding it keeps turning to the top */
function Dial({ label, value, saved, inactive, onRaise }: DialProps) {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // The interval reads these, so it sees each new value without restarting
    const live = useRef({ value, inactive, onRaise });
    useEffect(() => { live.current = { value, inactive, onRaise }; });

    const stop = () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
    };
    useEffect(() => stop, []);

    const turn = () => {
        const { value: v, inactive: off, onRaise: raise } = live.current;
        if (off || v >= MAX_IV) {
            stop();
            return false;
        }
        raise();
        return true;
    };

    const repeat = () => {
        timer.current = setTimeout(() => { if (turn()) repeat(); }, HOLD_STEP_MS);
    };

    const handlePointerDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        stop();
        if (!turn()) return;
        timer.current = setTimeout(() => { if (turn()) repeat(); }, HOLD_DELAY_MS);
    };

    // Pointer presses are handled above. A click with no pointer behind it is the keyboard.
    const handleClick = (e: MouseEvent) => {
        if (e.detail === 0) turn();
    };

    const angle = -135 + (value / MAX_IV) * 270;

    return (
        <button
            type="button"
            className={clsx(styles.dial, value > saved && styles.dialRaised)}
            aria-label={`Raise ${label}`}
            aria-disabled={inactive || value >= MAX_IV || undefined}
            onPointerDown={handlePointerDown}
            onPointerUp={stop}
            onPointerLeave={stop}
            onPointerCancel={stop}
            onClick={handleClick}
            onContextMenu={e => e.preventDefault()}
            style={{ '--angle': `${angle}deg` } as CSSProperties}
        >
            <span className={styles.dialCap} aria-hidden />
        </button>
    );
}

/** A Pokémon the deck can edit, from a save slot or the Ranch */
export interface EditablePokemon {
    speciesIndex: number;
    nickname: string;
    level: number;
    ivs: Gen1IVs;
}

interface IvEditorProps {
    /** Nothing chosen yet shows the deck with its controls off */
    pokemon: EditablePokemon | null;
    /** What to say while nothing is chosen */
    emptyText?: string;
    saving: boolean;
    onSave: (ivs: StoredIVs) => void;
    /** What the deck is doing, such as "Saving...". Shows a spinner in place of the gauges. */
    busy?: string;
    /** How the last save went. Shown in place of the gauges until any key is pressed. */
    result?: LabResult | null;
    onDismissResult?: () => void;
}

/** The Enhance deck. Remount with a new key when the saved IVs change, to start from them. */
export default function IvEditor({
    pokemon, emptyText = 'Choose a Pokémon on the monitor to edit it inside this save.',
    saving, onSave, busy, result, onDismissResult,
}: IvEditorProps) {
    const saved = pokemon?.ivs ?? { ...NO_IVS, hp: 0 };
    const start: StoredIVs = {
        attack: saved.attack,
        defense: saved.defense,
        speed: saved.speed,
        special: saved.special,
    };
    const [draft, setDraft] = useState<StoredIVs>(start);

    // The dials and keys wait while a result is on the screen
    const off = !pokemon || saving || !!result;
    const changed = RAISABLE.some(({ key }) => draft[key] !== saved[key]);

    return (
        <section className={lab.deck} aria-label="Enhance a Pokémon">
            <div className={lab.monitorTop} aria-hidden>
                <span className={lab.monitorLed} />
                <span className={lab.monitorVents} />
            </div>

            <div className={clsx(lab.screen, lab.deckScreen)}>
                <div className={lab.screenHeader}>
                    {pokemon ? (
                        <>
                            <span>{pokemon.nickname}</span>
                            <span>Lv. {pokemon.level}</span>
                        </>
                    ) : <span>Enhance a Pokémon</span>}
                </div>

                {busy || result ? (
                    <div className={lab.deckBody}>
                        {busy ? <DeckBusy text={busy} /> : result && <DeckResult result={result} />}
                    </div>
                ) : pokemon ? (
                    <div className={styles.body}>
                        <p className={styles.species}>{dexDict[pokemon.speciesIndex]?.name}</p>
                        <div className={styles.rows}>
                            <div className={styles.row}>
                                <span className={styles.label}>HP</span>
                                <Gauge label="HP" saved={saved.hp} value={hpIVFrom(draft)} />
                                <span className={styles.value}>{hpIVFrom(draft)}</span>
                            </div>
                            {RAISABLE.map(({ key, label }) => (
                                <div key={key} className={styles.row}>
                                    <span className={styles.label}>{label}</span>
                                    <Gauge label={label} saved={saved[key]} value={draft[key]} />
                                    <span className={styles.value}>{draft[key]}</span>
                                </div>
                            ))}
                        </div>
                        <p className={styles.note}>
                            HP comes from the other four. Odd numbers raise it and even numbers lower it, so it&apos;s only 15 when all four are odd.
                        </p>
                    </div>
                ) : (
                    <p className={styles.empty}>{emptyText}</p>
                )}
            </div>

            {/* In the same order as the rows on the screen */}
            <div className={styles.dials}>
                {RAISABLE.map(({ key, label }) => (
                    <Dial
                        key={key}
                        label={label}
                        value={draft[key]}
                        saved={saved[key]}
                        inactive={off}
                        onRaise={() => setDraft(d => ({ ...d, [key]: Math.min(d[key] + 1, MAX_IV) }))}
                    />
                ))}
            </div>

            <DeckAck onAck={result ? () => onDismissResult?.() : null}>
                <div className={lab.deckControls}>
                    <DeckPill label="Reset" onClick={() => setDraft(start)} inactive={off || !changed}>
                        <RotateCcw size={18} aria-hidden />
                    </DeckPill>
                    <DeckKey label={saving ? 'Saving...' : 'Save changes'} onClick={() => onSave(draft)} inactive={off || !changed}>
                        <Save size={22} strokeWidth={2.5} aria-hidden />
                    </DeckKey>
                </div>
            </DeckAck>
        </section>
    );
}
