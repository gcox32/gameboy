'use client';

import { CSSProperties, useRef, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { usePokemonSprites } from '@/hooks/usePokemonSprites';
import { usePokemonSizes } from '@/hooks/usePokemonSizes';
import { displayHeightM } from '@/utils/pokemon/size';
import { dexDict } from '@/utils/pokemon/dicts';
import { modelUrl } from '@/lib/assets';
import { ModelControls, PlatformModel } from './PlatformModel';
import { ModelBoard } from './ModelBoard';
import type { LabEntry } from './types';
import styles from '../lab.module.css';

/*
 * A Pokémon's height on the pad, as a share of the pad scene's width (see displayHeightM).
 * The sprites fill their canvas, so the image height is the Pokémon's.
 */
const SCALE_PER_M = 0.65;
/** Keeps the very smallest from vanishing */
const SCALE_MIN = 0.1;

/** The turntable's speed until the knob's turned, in degrees a second */
const START_SPEED = 24;

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
    const dexNo = entry ? dexDict[entry.speciesIndex]?.pokedexNo : undefined;
    // A Pokémon with a 3D model turns on the pad; the rest show their sprite
    const model = ready && dexNo && dexNo !== 'NULL' ? modelUrl(dexNo, 'stadium') : null;
    const scale = spriteScale(size?.height ?? null);

    // The model board. Its knob stays where it's put, whoever comes and goes on the pad.
    const [speed, setSpeed] = useState(START_SPEED);
    const controls = useRef<ModelControls>(null);
    // What the model on the pad reported, kept against its key so a new Pokémon starts blank
    const [loaded, setLoaded] = useState<{ key: string; clips: string[]; playing: string | null; failed: boolean } | null>(null);
    const current = loaded && entry && loaded.key === entry.key ? loaded : null;
    const report = (key: string, change: Partial<NonNullable<typeof loaded>>) =>
        setLoaded(prev => ({ ...(prev?.key === key ? prev : { key, clips: [], playing: null, failed: false }), ...change }));

    const spriteImage = entry && sprite && (
        <Image
            // A new Pokémon remounts, so it materializes
            key={entry.key}
            src={sprite}
            alt={entry.nickname}
            width={128}
            height={128}
            className={styles.platformSprite}
            style={{ ...spriteStyle, '--mon-scale': scale } as CSSProperties}
            unoptimized
        />
    );

    return (
        <div className={clsx(styles.platform, entry && styles.platformActive)}>
            <div className={styles.platformScene}>
                <div className={styles.beam} aria-hidden />
                <div className={styles.platformMon}>
                    {entry && model ? (
                        <PlatformModel
                            // A new Pokémon remounts, so it materializes
                            key={entry.key}
                            src={model}
                            alt={entry.nickname}
                            scale={scale}
                            speed={speed}
                            fallback={spriteImage}
                            controls={controls}
                            onClips={clips => report(entry.key, { clips })}
                            onClip={playing => report(entry.key, { playing })}
                            onFail={() => report(entry.key, { failed: true })}
                        />
                    ) : (
                        spriteImage
                    )}
                </div>
                <div className={styles.pad} aria-hidden>
                    <div className={styles.padBase} />
                    <div className={styles.padTop} />
                    <div className={styles.padGlow} />
                </div>
            </div>
            {/* Slides out while the Pokémon on the pad is a 3D model */}
            <ModelBoard
                shown={!!(entry && model) && !current?.failed}
                clips={current?.clips ?? []}
                playing={current?.playing ?? null}
                onPlay={clip => controls.current?.play(clip)}
                speed={speed}
                onSpeedChange={setSpeed}
            />
        </div>
    );
}
