'use client';

import { DetailedHTMLProps, HTMLAttributes, Ref, useEffect, useImperativeHandle, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from '../lab.module.css';

declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
                src: string;
                alt?: string;
                autoplay?: boolean;
                'animation-name'?: string;
                'auto-rotate'?: boolean;
                'auto-rotate-delay'?: number;
                'rotation-per-second'?: string;
                'camera-orbit'?: string;
                'min-camera-orbit'?: string;
                'max-camera-orbit'?: string;
                'field-of-view'?: string;
                'interaction-prompt'?: string;
                'shadow-intensity'?: number;
                'shadow-softness'?: number;
                'environment-image'?: string;
                exposure?: number;
                loading?: 'auto' | 'lazy' | 'eager';
            };
        }
    }
}

/** The parts of model-viewer's element this uses */
interface ModelViewerElement extends HTMLElement {
    availableAnimations: string[];
    animationName: string | undefined;
    animationCrossfadeDuration: number;
    currentTime: number;
    /** The current clip's length, in seconds */
    duration: number;
    play(options?: { repetitions?: number }): void;
    /** How far the turntable has turned, in radians */
    readonly turntableRotation: number;
    resetTurntableRotation(theta?: number): void;
}

/*
 * Lit's warnings, which only its dev build gives (next dev resolves its "development" export).
 * Neither is ours: "dev-mode" says that build is on, and model-viewer's own updated() schedules
 * a second update whenever it syncs the camera limits ("change-in-update"). Lit skips any warning
 * whose code is already in this set, so filling it before the element loads keeps the console clear.
 */
function loadModelViewer() {
    const g = globalThis as { litIssuedWarnings?: Set<string> };
    g.litIssuedWarnings ??= new Set();
    g.litIssuedWarnings.add('dev-mode').add('change-in-update');
    return import('@google/model-viewer');
}

/** The loop a model stands in, and goes back to after any other clip (see build-model.mjs) */
export const IDLE_CLIP = 'idle';

/**
 * Clips that end with the Pokémon somewhere off the pad: Donphan's Rollout carries it ten
 * body-lengths away. It fades out over the clip's last quarter, as it goes, then cuts back to
 * idle and materializes on the pad; fading back to idle would slide it home across the scene.
 */
const LEAVES_PAD = new Set(['rollout']);
/** A faint stays down, as in battle, until another clip is played */
const HOLDS = new Set(['faint']);
const LEAVING_SHARE = 0.25;

/** What the model monitor's keys and knob can ask of the model on its screen */
export interface ModelControls {
    /** Plays a clip once, then goes back to idle (a faint stays down). Idle itself loops. */
    play(clip: string): void;
    /** Turns the model on its turntable by this many degrees, clockwise as the knob turns */
    turn(degrees: number): void;
}

interface PlatformModelProps {
    src: string;
    alt: string;
    /** How fast the turntable turns, in degrees a second; negative turns it the other way */
    speed: number;
    controls?: Ref<ModelControls>;
    /** The model's clips, once it's loaded */
    onClips?: (clips: string[]) => void;
    /** The clip now playing */
    onClip?: (clip: string) => void;
    onFail?: () => void;
}

/**
 * A Pokémon's 3D model on the model monitor's screen, framed whole, turning on its turntable and
 * playing its idle loop, the way Stadium's Lab shows them. If it can't load it shows nothing and
 * reports it (onFail), and the monitor says so.
 */
export function PlatformModel({ src, alt, speed, controls, onClips, onClip, onFail }: PlatformModelProps) {
    const ref = useRef<ModelViewerElement>(null);
    /** The fetched model as a blob: URL, once both it and the element are ready */
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading');
    // The latest callbacks, for the element's listeners, which are added once
    const report = useRef({ onClips, onClip, onFail });
    useEffect(() => { report.current = { onClips, onClip, onFail }; });

    /*
     * The file is fetched here rather than by model-viewer, which logs a failed fetch and then
     * shows an empty scene instead of reporting the error. The element touches window, so it's
     * only defined in the browser.
     */
    useEffect(() => {
        let live = true;
        let url: string | null = null;
        Promise.all([
            fetch(src).then((res) => {
                if (!res.ok) throw new Error(`${res.status} for ${src}`);
                return res.blob();
            }),
            loadModelViewer(),
        ])
            .then(([blob]) => {
                url = URL.createObjectURL(blob);
                if (live) setBlobUrl(url);
            })
            .catch(() => live && setState('failed'));
        return () => {
            live = false;
            if (url) URL.revokeObjectURL(url);
        };
    }, [src]);

    useEffect(() => {
        if (state === 'failed') report.current.onFail?.();
    }, [state]);

    /** The fade-out while a clip carries the Pokémon off the pad */
    const leaving = useRef<Animation | null>(null);

    /** Starts a clip: idle loops, anything else plays once */
    const start = (el: ModelViewerElement, clip: string) => {
        leaving.current?.cancel();
        leaving.current = null;
        /*
         * A clip that's played once is left on its last frame, and playing it again reuses it as
         * it is, so it would "finish" straight away. Rewinding first starts every one-shot from
         * its first frame. It has to come before play(): it rewinds the whole mixer, whose clock
         * also times the crossfade, and rewinding after would hold the fade until the clock caught
         * up again. Idle is only rewound to its first frame as it fades out, which doesn't show.
         */
        if (clip !== IDLE_CLIP) el.currentTime = 0;
        el.animationName = clip;
        el.play({ repetitions: clip === IDLE_CLIP ? Infinity : 1 });
        if (LEAVES_PAD.has(clip)) {
            const ms = (el.duration || 3) * 1000;
            leaving.current = el.animate([{ opacity: 1 }, { opacity: 0 }], {
                delay: ms * (1 - LEAVING_SHARE),
                duration: ms * LEAVING_SHARE,
                fill: 'forwards',
            });
        }
        report.current.onClip?.(clip);
    };

    useImperativeHandle(controls, () => ({
        play(clip) {
            const el = ref.current;
            if (el && state === 'loaded' && el.availableAnimations.includes(clip)) start(el, clip);
        },
        turn(degrees) {
            const el = ref.current;
            if (el && state === 'loaded') el.resetTurntableRotation(el.turntableRotation + degrees * Math.PI / 180);
        },
    }), [state]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const onLoad = () => {
            setState('loaded');
            report.current.onClips?.(el.availableAnimations);
            report.current.onClip?.(IDLE_CLIP);
        };
        const onError = () => setState('failed');
        // A clip played once has ended: back to the idle loop, unless it stays where it ended
        const onFinished = () => {
            if (HOLDS.has(el.animationName ?? '')) return;
            const left = LEAVES_PAD.has(el.animationName ?? '');
            if (left) el.animationCrossfadeDuration = 0;
            start(el, IDLE_CLIP);
            if (!left) return;
            el.animationCrossfadeDuration = 300;
            // Restarts the materialize flicker, as if it had just been sent to the pad
            el.style.animation = 'none';
            void el.offsetWidth;
            el.style.animation = '';
        };
        el.addEventListener('load', onLoad);
        el.addEventListener('error', onError);
        el.addEventListener('finished', onFinished);
        return () => {
            el.removeEventListener('load', onLoad);
            el.removeEventListener('error', onError);
            el.removeEventListener('finished', onFinished);
        };
    }, [blobUrl]);

    if (state === 'failed' || !blobUrl) return null;

    return (
        <model-viewer
            ref={ref}
            src={blobUrl}
            alt={alt}
            // Held back until it's loaded, so it materializes whole rather than popping in
            className={clsx(styles.screenModel, state === 'loaded' && styles.modelLoaded)}
            // Its idle loop from the ROM (see scripts/stadium2/build-model.mjs), turning as it plays
            autoplay
            animation-name={IDLE_CLIP}
            auto-rotate
            auto-rotate-delay={0}
            // The model monitor's knob sets this; the model keeps whatever angle it had reached
            rotation-per-second={`${speed}deg`}
            // Looking down at it a little, as from across the room, framed whole with a little
            // room for a rearing attack
            camera-orbit="0deg 78deg 95%"
            min-camera-orbit="auto auto 0%"
            max-camera-orbit="auto auto 1000%"
            field-of-view="22deg"
            interaction-prompt="none"
            shadow-intensity={0.9}
            shadow-softness={0.8}
            environment-image="neutral"
            exposure={1.1}
            loading="eager"
        />
    );
}
