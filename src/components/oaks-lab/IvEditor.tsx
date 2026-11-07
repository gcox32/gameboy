'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Plus, RotateCcw, Save } from 'lucide-react';
import { dexDict } from '@/utils/pokemon/dicts';
import { SlotPokemon } from '@/utils/pokemon/gen1Save';
import { MAX_IV, StoredIVs, hpIVFrom } from '@/utils/pokemon/stats';
import { DeckKey, DeckPill, press } from './LabStage';
import lab from './lab.module.css';
import styles from './ivEditor.module.css';

const RAISABLE: { key: keyof StoredIVs; label: string }[] = [
    { key: 'attack', label: 'Attack' },
    { key: 'defense', label: 'Defense' },
    { key: 'speed', label: 'Speed' },
    { key: 'special', label: 'Special' },
];

const NO_IVS: StoredIVs = { attack: 0, defense: 0, speed: 0, special: 0 };

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

interface IvEditorProps {
    /** Nothing chosen yet shows the deck with its controls off */
    pokemon: SlotPokemon | null;
    saving: boolean;
    onSave: (ivs: StoredIVs) => void;
}

/** The Enhance deck. Remount with a new key when the saved IVs change, to start from them. */
export default function IvEditor({ pokemon, saving, onSave }: IvEditorProps) {
    const saved = pokemon?.ivs ?? { ...NO_IVS, hp: 0 };
    const start: StoredIVs = {
        attack: saved.attack,
        defense: saved.defense,
        speed: saved.speed,
        special: saved.special,
    };
    const [draft, setDraft] = useState<StoredIVs>(start);

    const off = !pokemon || saving;
    const changed = RAISABLE.some(({ key }) => draft[key] !== saved[key]);

    return (
        <section className={lab.deck} aria-label="Enhance a Pokémon">
            <div className={lab.monitorTop} aria-hidden>
                <span className={lab.monitorLed} />
                <span className={lab.monitorVents} />
            </div>

            {/* One screen behind the rows, with each row's button on the casing beside it */}
            <div className={styles.frame}>
                <div className={clsx(lab.screen, styles.screen)} aria-hidden />

                <div className={clsx(lab.screenHeader, styles.header)}>
                    {pokemon ? (
                        <>
                            <span>{pokemon.nickname}</span>
                            <span>Lv. {pokemon.level}</span>
                        </>
                    ) : <span>Enhance a Pokémon</span>}
                </div>

                {pokemon ? (
                    <>
                        <p className={styles.species}>{dexDict[pokemon.speciesIndex]?.name}</p>

                        <div className={styles.row} style={{ gridRow: 3 }}>
                            <span className={styles.label}>HP</span>
                            <Gauge label="HP" saved={saved.hp} value={hpIVFrom(draft)} />
                            <span className={styles.value}>{hpIVFrom(draft)}</span>
                        </div>
                        {RAISABLE.map(({ key, label }, i) => (
                            <div key={key} className={styles.row} style={{ gridRow: i + 4 }}>
                                <span className={styles.label}>{label}</span>
                                <Gauge label={label} saved={saved[key]} value={draft[key]} />
                                <span className={styles.value}>{draft[key]}</span>
                            </div>
                        ))}

                        <p className={styles.note}>
                            HP comes from the other four. Odd numbers raise it and even numbers lower it, so it&apos;s only 15 when all four are odd.
                        </p>
                    </>
                ) : (
                    <p className={styles.empty}>Choose a Pokémon on the monitor to edit it inside this save.</p>
                )}

                {RAISABLE.map(({ key, label }, i) => (
                    <button
                        key={key}
                        type="button"
                        className={styles.raise}
                        style={{ gridRow: i + 4 }}
                        aria-label={`Raise ${label}`}
                        title={`Raise ${label}`}
                        {...press(off || draft[key] >= MAX_IV, () => setDraft(d => ({ ...d, [key]: Math.min(d[key] + 1, MAX_IV) })))}
                    >
                        <Plus size={14} strokeWidth={3} aria-hidden />
                    </button>
                ))}
            </div>

            <div className={lab.deckControls}>
                <DeckPill label="Reset" onClick={() => setDraft(start)} inactive={off || !changed}>
                    <RotateCcw size={18} aria-hidden />
                </DeckPill>
                <DeckKey label={saving ? 'Saving...' : 'Save changes'} onClick={() => onSave(draft)} inactive={off || !changed}>
                    <Save size={22} strokeWidth={2.5} aria-hidden />
                </DeckKey>
            </div>
        </section>
    );
}
