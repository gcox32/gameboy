'use client';

import { CSSProperties, KeyboardEvent, PointerEvent, useRef, useState } from 'react';
import clsx from 'clsx';
import { press } from './press';
import styles from '../lab.module.css';

interface SlideSwitchProps<T extends string> {
    label: string;
    options: { id: T; label: string; inactive?: boolean }[];
    value: T;
    onChange: (value: T) => void;
    /** Narrower positions, for the decks */
    small?: boolean;
    /** Prints each position's name beside its light, for a switch nothing nearby explains */
    printed?: boolean;
}

/**
 * A slide switch with a light over each position, so it's plain only one is on. Press a position,
 * or grab the thumb and drag it: it follows the pointer, then settles into the nearest position.
 */
export function SlideSwitch<T extends string>({ label, options, value, onChange, small, printed }: SlideSwitchProps<T>) {
    const index = Math.max(options.findIndex(o => o.id === value), 0);
    const refs = useRef<(HTMLButtonElement | null)[]>([]);
    const thumbRef = useRef<HTMLSpanElement>(null);
    // While dragging: where the press started, and the thumb's position in stops (fractional)
    const [drag, setDrag] = useState<{ startX: number; pos: number } | null>(null);
    // A drag ends with a click on the stop it started from, which would undo it
    const swallowClick = useRef(false);

    /** The usable position nearest to a dragged one, so the thumb never settles on an inactive stop */
    const nearestActive = (pos: number) => {
        let best = index;
        for (let i = 0; i < options.length; i++) {
            if (!options[i].inactive && Math.abs(i - pos) < Math.abs(best - pos)) best = i;
        }
        return best;
    };

    const grab = (e: PointerEvent<HTMLButtonElement>) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag({ startX: e.clientX, pos: index });
    };

    const slide = (e: PointerEvent<HTMLButtonElement>) => {
        if (!drag) return;
        const stopWidth = thumbRef.current?.offsetWidth || 1;
        const pos = Math.min(options.length - 1, Math.max(0, index + (e.clientX - drag.startX) / stopWidth));
        setDrag({ ...drag, pos });
    };

    const release = (e: PointerEvent<HTMLButtonElement>) => {
        if (!drag) return;
        const to = nearestActive(drag.pos);
        setDrag(null);
        if (e.type !== 'pointerup' || drag.pos === index) return;
        swallowClick.current = true;
        // In case no click follows, so the next real press isn't eaten
        setTimeout(() => { swallowClick.current = false; });
        if (to !== index) onChange(options[to].id);
    };

    const choose = (id: T) => {
        if (swallowClick.current) {
            swallowClick.current = false;
            return;
        }
        onChange(id);
    };

    const handleKey = (e: KeyboardEvent) => {
        const by = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
            : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!by) return;
        e.preventDefault();
        for (let i = index + by; i >= 0 && i < options.length; i += by) {
            if (options[i].inactive) continue;
            onChange(options[i].id);
            refs.current[i]?.focus();
            return;
        }
    };

    return (
        <div
            className={clsx(styles.switch, small && styles.switchSmall, printed && styles.switchPrinted)}
            role="radiogroup"
            aria-label={label}
            onKeyDown={handleKey}
            style={{ '--stops': options.length } as CSSProperties}
        >
            <div className={styles.track} aria-hidden>
                <span
                    ref={thumbRef}
                    className={clsx(styles.thumb, drag && styles.thumbDragging)}
                    style={{ transform: `translateX(${(drag ? drag.pos : index) * 100}%)` }}
                />
            </div>
            {options.map((o, i) => (
                <button
                    key={o.id}
                    ref={el => { refs.current[i] = el; }}
                    type="button"
                    role="radio"
                    aria-checked={value === o.id}
                    aria-label={o.label}
                    title={o.label}
                    tabIndex={value === o.id ? 0 : -1}
                    className={clsx(styles.stop, drag && styles.stopDragging)}
                    style={{ gridColumn: i + 1 }}
                    {...press(o.inactive, () => choose(o.id))}
                    // The thumb sits over the position that's on, so that's where it's grabbed
                    {...(i === index && {
                        onPointerDown: grab,
                        onPointerMove: slide,
                        onPointerUp: release,
                        onPointerCancel: release,
                    })}
                >
                    <span className={styles.stopHead} aria-hidden>
                        <i className={clsx(styles.lamp, value === o.id ? styles.lamp_on : styles.lamp_off)} />
                        {printed && <span className={styles.stopName}>{o.label}</span>}
                    </span>
                </button>
            ))}
        </div>
    );
}
