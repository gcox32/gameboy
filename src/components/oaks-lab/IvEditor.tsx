'use client';

import { useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { dexDict } from '@/utils/pokemon/dicts';
import { SlotPokemon } from '@/utils/pokemon/gen1Save';
import { MAX_IV, StoredIVs, hpIVFrom } from '@/utils/pokemon/stats';
import paper from '@/components/modals/paper.module.css';
import { spriteUrl } from './LabSave';
import styles from './ivEditor.module.css';

const RAISABLE: { key: keyof StoredIVs; label: string }[] = [
    { key: 'attack', label: 'Attack' },
    { key: 'defense', label: 'Defense' },
    { key: 'speed', label: 'Speed' },
    { key: 'special', label: 'Special' },
];

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
    pokemon: SlotPokemon;
    saving: boolean;
    onSave: (ivs: StoredIVs) => void;
}

/** Remount with a new key when the saved IVs change, to start from them */
export default function IvEditor({ pokemon, saving, onSave }: IvEditorProps) {
    const saved = pokemon.ivs;
    const [draft, setDraft] = useState<StoredIVs>({
        attack: saved.attack,
        defense: saved.defense,
        speed: saved.speed,
        special: saved.special,
    });

    const changed = RAISABLE.some(({ key }) => draft[key] !== saved[key]);
    const sprite = spriteUrl(pokemon.speciesIndex);

    return (
        <section className={`${paper.modalContent} ${paper.paperModal} ${styles.card}`}>
            <header className={styles.header}>
                {sprite && (
                    <Image src={sprite} alt="" width={64} height={64} className={styles.sprite} unoptimized />
                )}
                <div>
                    <h2 className={styles.name}>{pokemon.nickname}</h2>
                    <p className={styles.meta}>
                        {dexDict[pokemon.speciesIndex]?.name} · Lv. {pokemon.level}
                    </p>
                </div>
            </header>

            <h3 className={styles.sectionTitle}>IVs</h3>
            <div className={styles.rows}>
                <div className={styles.row}>
                    <span className={styles.label}>HP</span>
                    <Gauge label="HP" saved={saved.hp} value={hpIVFrom(draft)} />
                    <span className={styles.value}>{hpIVFrom(draft)}</span>
                    <span />
                </div>
                {RAISABLE.map(({ key, label }) => (
                    <div key={key} className={styles.row}>
                        <span className={styles.label}>{label}</span>
                        <Gauge label={label} saved={saved[key]} value={draft[key]} />
                        <span className={styles.value}>{draft[key]}</span>
                        <button
                            type="button"
                            className={styles.raise}
                            aria-label={`Raise ${label}`}
                            disabled={saving || draft[key] >= MAX_IV}
                            onClick={() => setDraft(d => ({ ...d, [key]: Math.min(d[key] + 1, MAX_IV) }))}
                        >
                            +
                        </button>
                    </div>
                ))}
            </div>
            <p className={styles.note}>
                HP comes from the other four. Odd numbers raise it and even numbers lower it, so it&apos;s only 15 when all four are odd.
            </p>

            <div className={styles.actions}>
                <button
                    type="button"
                    className={paper.secondaryButton}
                    disabled={saving || !changed}
                    onClick={() => setDraft({ attack: saved.attack, defense: saved.defense, speed: saved.speed, special: saved.special })}
                >
                    Reset
                </button>
                <button
                    type="button"
                    className={paper.primaryButton}
                    disabled={saving || !changed}
                    onClick={() => onSave(draft)}
                >
                    {saving ? 'Saving...' : 'Save changes'}
                </button>
            </div>
        </section>
    );
}
