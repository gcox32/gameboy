'use client';

import { KeyboardEvent, PointerEvent, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { press } from './press';
import { IDLE_CLIP } from './PlatformModel';
import styles from '../lab.module.css';

/*
 * The model board: the plate that slides out under the pad when the Pokémon on it is a 3D model.
 * Its keys play the model's clips and its knob drives the turntable. Like the rest of the Lab's
 * hardware, the keys are the same for every Pokémon: one with no clip for a key still presses and
 * does nothing, and the readout says what's playing.
 */

/** The clips every model can have (see CLIP_NAMES in scripts/stadium2/build-model.mjs) */
const KEYS = [
    { id: 'idle', label: 'Idle' },
    { id: 'entrance', label: 'Entrance' },
    { id: 'attack', label: 'Attack' },
    { id: 'faint', label: 'Faint' },
    { id: 'special', label: 'Special' },
] as const;

const COMMON = new Set<string>(KEYS.map(k => k.id));

/** A species' own clip (Donphan's Rollout), which the Special key plays */
export function specialClip(clips: string[]): string | undefined {
    return clips.find(c => !COMMON.has(c));
}

/** The turntable's top speed either way, in degrees a second */
export const MAX_SPEED = 90;
/** How far the knob turns either side of stopped */
const SWEEP = 135;
/** Close enough to the middle and it clicks into the stop */
const DETENT = 10;
/** One arrow-key press, in degrees a second */
const STEP = 6;

const speedToAngle = (speed: number) => (speed / MAX_SPEED) * SWEEP;

function angleToSpeed(angle: number): number {
    const clamped = Math.max(-SWEEP, Math.min(SWEEP, angle));
    if (Math.abs(clamped) < DETENT) return 0;
    return Math.round((clamped / SWEEP) * MAX_SPEED);
}

/** Knob degrees per pixel dragged: the whole sweep in about 180px */
const DRAG_RATE = 1.5;

/**
 * Turns the platform: middle stops it, right turns it one way and left the other, faster the
 * further it goes. Dragged in a straight line (right or up turns it clockwise), as knobs on a
 * screen are, rather than round its rim; the wheel and arrow keys nudge it.
 */
function TurntableKnob({ speed, onChange }: { speed: number; onChange: (speed: number) => void }) {
    // While turning: where the pointer was, and where the knob is (fractional, before detents)
    const drag = useRef<{ x: number; y: number; knob: number } | null>(null);
    const set = (next: number) => { if (next !== speed) onChange(next); };

    const grab = (e: PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.focus();
        drag.current = { x: e.clientX, y: e.clientY, knob: speedToAngle(speed) };
    };

    const turn = (e: PointerEvent<HTMLDivElement>) => {
        if (!drag.current) return;
        const by = (e.clientX - drag.current.x - (e.clientY - drag.current.y)) * DRAG_RATE;
        const knob = Math.max(-SWEEP, Math.min(SWEEP, drag.current.knob + by));
        drag.current = { x: e.clientX, y: e.clientY, knob };
        set(angleToSpeed(knob));
    };

    const release = () => { drag.current = null; };

    const nudge = (by: number) => set(Math.max(-MAX_SPEED, Math.min(MAX_SPEED, speed + by)));

    const handleKey = (e: KeyboardEvent) => {
        const by = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? STEP
            : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -STEP : 0;
        if (e.key === 'Home') {
            e.preventDefault();
            set(0);
        } else if (by) {
            e.preventDefault();
            nudge(by);
        }
    };

    // The wheel nudges it, without scrolling the page while the pointer's over it
    const ref = useRef<HTMLDivElement>(null);
    const wheel = useRef(nudge);
    useEffect(() => { wheel.current = nudge; });
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            wheel.current(e.deltaY < 0 || e.deltaX > 0 ? STEP : -STEP);
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    return (
        <div className={styles.knobMount}>
            <div className={styles.knobDial} aria-hidden>
                <span className={styles.knobTickLeft} />
                <span className={styles.knobTickStop} />
                <span className={styles.knobTickRight} />
            </div>
            <div
                ref={ref}
                className={styles.knob}
                role="slider"
                tabIndex={0}
                aria-label="Turntable"
                aria-valuemin={-MAX_SPEED}
                aria-valuemax={MAX_SPEED}
                aria-valuenow={speed}
                aria-valuetext={speed === 0 ? 'Stopped' : `${Math.abs(speed)} degrees a second, ${speed > 0 ? 'clockwise' : 'anticlockwise'}`}
                title="Turntable"
                onPointerDown={grab}
                onPointerMove={turn}
                onPointerUp={release}
                onPointerCancel={release}
                onKeyDown={handleKey}
                onDoubleClick={() => set(0)}
            >
                {/* Only the face turns: the light and shadow on the body stay where the room puts them */}
                <span className={styles.knobFace} style={{ rotate: `${speedToAngle(speed)}deg` }}>
                    <i className={styles.knobPointer} />
                </span>
            </div>
        </div>
    );
}

interface ModelBoardProps {
    /** Out under the pad. Hidden, it's tucked away and can't be reached. */
    shown: boolean;
    /** The model's clips, empty until it's loaded */
    clips: string[];
    /** The clip playing now */
    playing: string | null;
    onPlay: (clip: string) => void;
    speed: number;
    onSpeedChange: (speed: number) => void;
}

export function ModelBoard({ shown, clips, playing, onPlay, speed, onSpeedChange }: ModelBoardProps) {
    const special = specialClip(clips);
    const clipFor = (id: string) => (id === 'special' ? special : clips.includes(id) ? id : undefined);
    const readout = !clips.length ? 'Loading' : playing ?? IDLE_CLIP;

    return (
        <div className={clsx(styles.modelBoardSlot, shown && styles.modelBoardShown)} inert={!shown}>
            <section className={styles.modelBoard} aria-label="Model controls">
                <div className={styles.modelReadout} role="status">
                    <span className={styles.modelReadoutClip}>
                        {playing && playing !== IDLE_CLIP ? `▶ ${readout}` : readout}
                    </span>
                    <span className={styles.modelReadoutSpeed}>
                        {speed === 0 ? 'Stop' : `${speed > 0 ? '↻' : '↺'} ${Math.abs(speed)}°/s`}
                    </span>
                </div>
                <div className={styles.modelBoardControls}>
                    <div className={styles.modelKeys} role="group" aria-label="Animations">
                        {KEYS.map(k => {
                            const clip = clipFor(k.id);
                            const on = !!clip && clip === playing;
                            return (
                                <div key={k.id} className={styles.modelKeyCell}>
                                    <i className={clsx(styles.lamp, on ? styles.lamp_on : styles.lamp_off)} aria-hidden />
                                    {/* Unprinted, like the console's buttons: the lamp and readout say what's playing */}
                                    <button
                                        type="button"
                                        className={styles.padKey}
                                        aria-pressed={on}
                                        aria-label={k.label}
                                        title={k.label}
                                        {...press(!clip, () => clip && onPlay(clip))}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <TurntableKnob speed={speed} onChange={onSpeedChange} />
                </div>
            </section>
        </div>
    );
}
