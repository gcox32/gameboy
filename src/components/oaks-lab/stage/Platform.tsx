'use client';

import { CSSProperties } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { usePokemonSprites } from '@/hooks/usePokemonSprites';
import { usePokemonSizes } from '@/hooks/usePokemonSizes';
import { displayHeightM } from '@/utils/pokemon/size';
import type { LabEntry } from './types';
import styles from '../lab.module.css';

/*
 * A Pokémon's height on the pad, as a share of the pad scene's width (see displayHeightM).
 * The sprites fill their canvas, so the image height is the Pokémon's.
 */
const SCALE_PER_M = 0.65;
/** Keeps the very smallest from vanishing */
const SCALE_MIN = 0.1;

function spriteScale(heightDm: number | null): number {
    return Math.max(SCALE_MIN, SCALE_PER_M * displayHeightM(heightDm));
}

interface PlatformProps {
    /** The Pokémon on the pad, or null when it's empty */
    entry: LabEntry | null;
}

/** The pad in the middle of the Lab. It's part of the room, so it never moves; a Pokémon appears on it. */
export function Platform({ entry }: PlatformProps) {
    // Hold the sprite back until its size is known, so it appears at its size and doesn't jump
    const { ready, sizeOf } = usePokemonSizes(entry ? [entry.speciesIndex] : []);
    const size = entry && ready ? sizeOf(entry.speciesIndex) : null;
    const { bySpecies, spriteStyle } = usePokemonSprites();
    const sprite = entry && ready ? bySpecies(entry.speciesIndex) : '';

    return (
        <div className={clsx(styles.platform, entry && styles.platformActive)}>
            <div className={styles.platformScene}>
                <div className={styles.beam} aria-hidden />
                <div className={styles.platformMon}>
                    {entry && sprite && (
                        <Image
                            // A new Pokémon remounts, so it materializes
                            key={entry.key}
                            src={sprite}
                            alt={entry.nickname}
                            width={128}
                            height={128}
                            className={styles.platformSprite}
                            style={{ ...spriteStyle, '--mon-scale': spriteScale(size?.height ?? null) } as CSSProperties}
                            unoptimized
                        />
                    )}
                </div>
                <div className={styles.pad} aria-hidden>
                    <div className={styles.padBase} />
                    <div className={styles.padTop} />
                    <div className={styles.padGlow} />
                </div>
            </div>
        </div>
    );
}
