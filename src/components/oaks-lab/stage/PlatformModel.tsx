'use client';

import { CSSProperties, DetailedHTMLProps, HTMLAttributes, ReactNode, useEffect, useRef, useState } from 'react';
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

interface PlatformModelProps {
    src: string;
    alt: string;
    /** The Pokémon's height on the pad, as a share of the scene's width (see spriteScale in Platform) */
    scale: number;
    /** Shown instead if the model can't load, so the pad is never left empty */
    fallback: ReactNode;
}

/** A Pokémon's 3D model turning slowly on the pad and playing its idle loop, the way Stadium's Lab shows them */
export function PlatformModel({ src, alt, scale, fallback }: PlatformModelProps) {
    const ref = useRef<HTMLElement>(null);
    /** The fetched model as a blob: URL, once both it and the element are ready */
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading');

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
            import('@google/model-viewer'),
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
        const el = ref.current;
        if (!el) return;
        const onLoad = () => setState('loaded');
        const onError = () => setState('failed');
        el.addEventListener('load', onLoad);
        el.addEventListener('error', onError);
        return () => {
            el.removeEventListener('load', onLoad);
            el.removeEventListener('error', onError);
        };
    }, [blobUrl]);

    if (state === 'failed') return <>{fallback}</>;
    if (!blobUrl) return null;

    return (
        <model-viewer
            ref={ref}
            src={blobUrl}
            alt={alt}
            // Held back until it's loaded, so it materializes whole rather than popping in
            className={clsx(styles.platformModel, state === 'loaded' && styles.platformModelLoaded)}
            style={{ '--mon-scale': scale } as CSSProperties}
            // Its idle loop from the ROM (see scripts/stadium2/build-model.mjs), turning as it plays
            autoplay
            animation-name="idle"
            auto-rotate
            auto-rotate-delay={0}
            rotation-per-second="24deg"
            // Looking down at it a little, as from across the room. The radius is a share of
            // model-viewer's framing distance, which fits the whole bounding sphere and so leaves
            // the Pokémon smaller than its sprite; this closes it to about the sprite's height
            camera-orbit="0deg 78deg 70%"
            min-camera-orbit="auto auto 0%"
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
