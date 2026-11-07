'use client';

import { CSSProperties } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { spriteUrl } from './sprite';
import { usePokemonSizes } from './usePokemonSize';
import type { LabEntry } from './types';
import styles from '../lab.module.css';

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

function spriteScale(heightDm: number | null): number {
    if (!heightDm) return SCALE_UNKNOWN;
    const m = heightDm / 10;
    const scale = m <= GIANT_FROM_M
        ? SCALE_PER_M * m
        : SCALE_PER_M * GIANT_FROM_M * (m / GIANT_FROM_M) ** GIANT_CURVE;
    return Math.max(SCALE_MIN, scale);
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
    const sprite = entry && ready ? spriteUrl(entry.speciesIndex) : '';

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
                            style={{ '--mon-scale': spriteScale(size?.height ?? null) } as CSSProperties}
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
