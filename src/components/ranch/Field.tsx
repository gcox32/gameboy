'use client';

import { CSSProperties, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { usePokemonSprites } from '@/hooks/usePokemonSprites';
import { usePokemonSizes } from '@/hooks/usePokemonSizes';
import { displayHeightM } from '@/utils/pokemon/size';
import {
    RanchField, Spot, depthScale, fieldDistance, onGround, randomSpot, seededRandom, spreadSpots,
} from './fields';
import type { RanchPokemon } from './types';
import styles from './field.module.css';

/** A Pokémon 1 m tall at the front of the field, as a share of the field's height */
const FRONT_HEIGHT_PER_M = 0.15;
/** Small Pokémon are drawn at least this tall, so a Diglett is still there to click */
const MIN_HEIGHT_M = 0.5;
/** Walking speed, in fieldDistance units a second */
const WALK_SPEED = 4;
/** How long a Pokémon stands about between walks */
const IDLE_MS = [2500, 10000] as const;

interface Walker extends Spot {
    /** The sprites face left, so this flips them */
    facingRight: boolean;
    /** How long the current walk takes */
    ms: number;
    walking: boolean;
}

function useReducedMotion(): boolean {
    return useSyncExternalStore(
        onChange => {
            const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
            mq.addEventListener('change', onChange);
            return () => mq.removeEventListener('change', onChange);
        },
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        () => true,
    );
}

/** Somewhere a short stroll away, on the ground */
function nextSpot(field: RanchField, from: Spot): Spot {
    for (let i = 0; i < 10; i++) {
        const dx = (4 + Math.random() * 8) * (Math.random() < 0.5 ? -1 : 1);
        const dy = (Math.random() - 0.5) * 9;
        const to = { x: from.x + dx, y: from.y + dy };
        if (onGround(field, to)) return to;
    }
    return randomSpot(field, Math.random);
}

interface WandererProps {
    field: RanchField;
    pokemon: RanchPokemon;
    start: Spot;
    heightM: number;
    sprite: string;
    spriteStyle: CSSProperties;
    selected: boolean;
    highlighted: boolean;
    still: boolean;
    onSelect: () => void;
}

/** One Pokémon on the field. It stands about, then strolls somewhere nearby, until it's selected. */
function Wanderer({ field, pokemon, start, heightM, sprite, spriteStyle, selected, highlighted, still, onSelect }: WandererProps) {
    // Only the first start counts; after that it goes where it walks
    const [pos, setPos] = useState<Walker>(() => ({ ...start, facingRight: false, ms: 0, walking: false }));
    const posRef = useRef(pos);
    const paused = selected || still;

    useEffect(() => {
        if (paused) return;
        let timer: ReturnType<typeof setTimeout>;
        const set = (w: Walker) => { posRef.current = w; setPos(w); };

        const idle = () => {
            timer = setTimeout(walk, IDLE_MS[0] + Math.random() * (IDLE_MS[1] - IDLE_MS[0]));
        };
        const walk = () => {
            const from = posRef.current;
            const to = nextSpot(field, from);
            const ms = (fieldDistance(from, to) / WALK_SPEED) * 1000;
            set({ ...to, facingRight: to.x > from.x, ms, walking: true });
            timer = setTimeout(() => {
                set({ ...posRef.current, walking: false });
                idle();
            }, ms);
        };

        idle();
        return () => clearTimeout(timer);
    }, [paused, field]);

    const h = FRONT_HEIGHT_PER_M * Math.max(MIN_HEIGHT_M, heightM) * depthScale(field, pos.y);

    return (
        <button
            type="button"
            className={clsx(
                styles.mon,
                pos.walking && !paused && styles.walking,
                selected && styles.selected,
                highlighted && styles.highlighted,
            )}
            style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                zIndex: Math.round(pos.y * 10),
                '--ms': `${pos.ms}ms`,
                '--h': h,
            } as CSSProperties}
            onClick={onSelect}
            aria-label={pokemon.nickname || pokemon.speciesName}
            aria-pressed={selected}
        >
            <span className={styles.tag}>{pokemon.nickname || pokemon.speciesName}</span>
            <span className={styles.shadow} aria-hidden />
            <Image
                src={sprite}
                alt=""
                width={128}
                height={128}
                className={clsx(styles.sprite, pos.facingRight && styles.flipped)}
                style={spriteStyle}
                draggable={false}
                unoptimized
            />
        </button>
    );
}

interface FieldProps {
    field: RanchField;
    /** The Pokémon in the pen on show */
    pokemon: RanchPokemon[];
    /** Seeds where they start, so a pen looks the same each visit */
    seed: string;
    selectedId: string | null;
    highlightedId: string | null;
    onSelect: (id: string) => void;
}

/** The pen on show: its Pokémon roaming the corral, each drawn to its real size */
export function Field({ field, pokemon, seed, selectedId, highlightedId, onSelect }: FieldProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const still = useReducedMotion();
    const { bySpecies, spriteStyle } = usePokemonSprites();
    // Held back until the sizes are known, so nobody appears at one size and then jumps
    const { ready, sizeOf } = usePokemonSizes(pokemon.map(p => p.speciesIndex));

    const count = pokemon.length;
    const starts = useMemo(() => spreadSpots(field, count, seededRandom(seed)), [field, count, seed]);

    // A field wider than the screen opens on its open grass
    useEffect(() => {
        const el = scrollRef.current;
        if (!el || el.scrollWidth <= el.clientWidth) return;
        el.scrollLeft = (el.scrollWidth * field.focusX) / 100 - el.clientWidth / 2;
    }, [field]);

    return (
        <div ref={scrollRef} className={styles.field} style={{ '--aspect': field.aspect } as CSSProperties}>
            <div className={styles.scene}>
                <Image src={field.src} alt="" fill priority unoptimized className={styles.sceneImg} />
                {ready && pokemon.map((p, i) => {
                    const sprite = bySpecies(p.speciesIndex);
                    if (!sprite) return null;
                    return (
                        <Wanderer
                            key={p.id}
                            field={field}
                            pokemon={p}
                            start={starts[i]}
                            heightM={displayHeightM(sizeOf(p.speciesIndex)?.height)}
                            sprite={sprite}
                            spriteStyle={spriteStyle}
                            selected={p.id === selectedId}
                            highlighted={p.id === highlightedId}
                            still={still}
                            onSelect={() => onSelect(p.id)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
