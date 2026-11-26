'use client';

import { CSSProperties, KeyboardEvent, PointerEvent, ReactNode, Ref, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { press } from './press';
import { UI_MS } from './timing';
import { IDLE_CLIP, ModelControls, PlatformModel } from './PlatformModel';
import { entryModel } from './Platform';
import type { LabEntry } from './types';
import styles from '../lab.module.css';
import hanging from '../save/connectModal.module.css';
import own from './modelMonitor.module.css';

/*
 * The model monitor: a big Lab monitor lowered over the room on its cables, as the connect monitor
 * is, by the console's model button. Its screen shows the Pokémon on the pad as its 3D model, and
 * the hardware under the screen plays the model's clips and turns it.
 *
 * Like the rest of the Lab's hardware, its keys and knob are the same whoever's on the pad: one
 * with no clip still presses and does nothing, and the screen says what's playing. With nobody on
 * the pad, or a Pokémon with no model, the monitor still comes down and its screen says so.
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
function TurntableKnob({ speed, onChange, ref: outer }: {
    speed: number;
    onChange: (speed: number) => void;
    ref?: Ref<HTMLDivElement>;
}) {
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
    useImperativeHandle(outer, () => ref.current as HTMLDivElement);
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

/** How long the monitor takes to drop into view, and to lift back out */
const DROP_MS = UI_MS * 2;

/** The knob's position until it's turned, in degrees a second */
const START_SPEED = 24;

/** What the model on the screen reported, kept against its Pokémon so a new one starts blank */
interface Loaded {
    key: string;
    clips: string[];
    playing: string | null;
    failed: boolean;
}

interface ModelMonitorProps {
    open: boolean;
    onClose: () => void;
    /** The Pokémon on the pad */
    entry: LabEntry | null;
}

export function ModelMonitor({ open, onClose, entry }: ModelMonitorProps) {
    // Stays mounted after closing until the monitor has lifted out of view
    const [wasOpen, setWasOpen] = useState(open);
    const [leaving, setLeaving] = useState(false);
    if (wasOpen !== open) {
        setWasOpen(open);
        setLeaving(!open);
    }
    useEffect(() => {
        if (!leaving) return;
        const t = setTimeout(() => setLeaving(false), DROP_MS);
        return () => clearTimeout(t);
    }, [leaving]);

    // The knob stays where it's put, whoever comes and goes and however often the monitor's raised
    const [speed, setSpeed] = useState(START_SPEED);
    const controls = useRef<ModelControls>(null);
    const [loaded, setLoaded] = useState<Loaded | null>(null);
    const current = loaded && entry && loaded.key === entry.key ? loaded : null;
    const report = (key: string, change: Partial<Loaded>) =>
        setLoaded(prev => ({ ...(prev?.key === key ? prev : { key, clips: [], playing: null, failed: false }), ...change }));

    const model = entryModel(entry);
    const clips = current?.clips ?? [];
    const playing = current?.playing ?? null;
    const special = specialClip(clips);
    const clipFor = (id: string) => (id === 'special' ? special : clips.includes(id) ? id : undefined);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            // Claimed before the Lab behind it reacts
            e.stopPropagation();
            onClose();
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [open, onClose]);

    // The knob takes the focus as the monitor comes down, so the arrow keys turn it straight away
    const knobRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (open) knobRef.current?.focus({ preventScroll: true });
    }, [open]);

    if ((!open && !leaving) || typeof document === 'undefined') return null;

    // Nothing to show, a model on its way, or the model itself
    let screen: ReactNode;
    if (!entry) {
        screen = <p>The pad is empty</p>;
    } else if (!model) {
        screen = <p>No model for {entry.nickname}</p>;
    } else if (current?.failed) {
        screen = <p>No signal</p>;
    }
    const showing = !!(entry && model && !current?.failed);
    const loading = showing && !clips.length;

    return createPortal(
        <div
            className={clsx(styles.hardware, hanging.room, leaving && hanging.leaving)}
            style={{ '--ui-ms': `${UI_MS}ms`, '--drop-ms': `${DROP_MS}ms` } as CSSProperties}
        >
            <div className={hanging.overlay} onClick={onClose} />

            <section className={clsx(hanging.shell, own.shell)} role="dialog" aria-modal="true" aria-label="Model monitor">
                <div className={hanging.top}>
                    <span className={styles.monitorLed} aria-hidden />
                    <span className={styles.monitorVents} aria-hidden />
                    <button
                        type="button"
                        className={clsx(styles.rockerBtn, hanging.closeBtn)}
                        onClick={onClose}
                        aria-label="Close"
                        title="Close"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className={clsx(styles.screen, own.screen)}>
                    <div className={styles.screenHeader}>
                        <span>{entry?.nickname ?? 'Oak’s Lab'}</span>
                        {entry && <span>Lv. {entry.level}</span>}
                    </div>

                    <div className={own.view}>
                        {showing && entry && model && (
                            <PlatformModel
                                // A new Pokémon remounts, so it materializes
                                key={entry.key}
                                view="screen"
                                src={model}
                                alt={entry.nickname}
                                speed={speed}
                                fallback={null}
                                controls={controls}
                                onClips={c => report(entry.key, { clips: c })}
                                onClip={p => report(entry.key, { playing: p })}
                                onFail={() => report(entry.key, { failed: true })}
                            />
                        )}
                        {screen && <div className={clsx(styles.screenMessage, own.message)}>{screen}</div>}
                    </div>

                    {/* What's playing, and how the turntable's set. Held in place even when blank. */}
                    <div className={own.readout} role="status">
                        <span className={own.readoutClip}>
                            {!showing ? '' : loading ? 'Loading' : playing && playing !== IDLE_CLIP ? `▶ ${playing}` : IDLE_CLIP}
                        </span>
                        <span className={own.readoutSpeed}>
                            {speed === 0 ? 'Stop' : `${speed > 0 ? '↻' : '↺'} ${Math.abs(speed)}°/s`}
                        </span>
                    </div>

                    <div className={clsx(styles.static, loading && styles.staticOn)} aria-hidden />
                </div>

                <div className={own.controls}>
                    <div className={clsx(styles.modelKeys, own.keys)} role="group" aria-label="Animations">
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
                                        {...press(!clip, () => clip && controls.current?.play(clip))}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <TurntableKnob ref={knobRef} speed={speed} onChange={setSpeed} />
                </div>
            </section>
        </div>,
        document.body,
    );
}
