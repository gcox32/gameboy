'use client';

import { CSSProperties, ReactNode, createContext, useContext } from 'react';
import clsx from 'clsx';
import { press } from './press';
import type { LabResult } from './types';
import styles from '../lab.module.css';

interface LabDeckProps {
    title: string;
    /** What the deck's screen shows */
    children: ReactNode;
    /** The hardware under the screen */
    controls?: ReactNode;
    /** What the deck is doing, such as "Sending...". Shows a spinner in place of the screen. */
    busy?: string;
    /** How the last action went. Shown in place of the screen until any key is pressed. */
    result?: LabResult | null;
    onDismissResult?: () => void;
}

/** The upright deck on the left, which slides in for whichever mode is on */
export function LabDeck({ title, children, controls, busy, result, onDismissResult }: LabDeckProps) {
    return (
        <section className={styles.deck} aria-label={title}>
            <div className={styles.monitorTop} aria-hidden>
                <span className={styles.monitorLed} />
                <span className={styles.monitorVents} />
            </div>
            <div className={clsx(styles.screen, styles.deckScreen)}>
                <div className={styles.screenHeader}><span>{title}</span></div>
                <div className={styles.deckBody}>
                    {busy ? <DeckBusy text={busy} />
                        : result ? <DeckResult result={result} />
                        : children}
                </div>
            </div>
            {controls && (
                <DeckAck onAck={result ? () => onDismissResult?.() : null}>
                    <div className={styles.deckControls}>{controls}</div>
                </DeckAck>
            )}
        </section>
    );
}

/** The outcome of an action, in place of the deck's screen. Any deck key clears it. */
export function DeckResult({ result }: { result: LabResult }) {
    return (
        <div
            className={clsx(styles.deckReadout, result.tone === 'error' && styles.deckResultError)}
            role={result.tone === 'error' ? 'alert' : 'status'}
        >
            <p>{result.text}</p>
            <p className={clsx(styles.deckHint, styles.blink)}>Press any key</p>
        </div>
    );
}

/*
 * The deck's keys never come or go. While a result is on the screen, each of them acknowledges it
 * instead of doing its usual job, like any button clearing a text box in a game. The focus stays
 * on the key just pressed, so pressing it again clears the result.
 */
const DeckAckContext = createContext<(() => void) | null>(null);

/** Turns every deck key inside into "OK" while `onAck` is set */
export function DeckAck({ onAck, children }: { onAck: (() => void) | null; children: ReactNode }) {
    return <DeckAckContext.Provider value={onAck}>{children}</DeckAckContext.Provider>;
}

/** A ring of blocks lighting up in turn, while the deck waits on the server */
export function DeckBusy({ text }: { text: string }) {
    return (
        <div className={styles.deckReadout} role="status">
            <div className={styles.spinner} aria-hidden>
                {Array.from({ length: 8 }, (_, i) => (
                    <i key={i} style={{ '--i': i } as CSSProperties} />
                ))}
            </div>
            <p>{text}</p>
        </div>
    );
}

interface DeckKeyProps {
    label: string;
    onClick: () => void;
    /** Nothing to do right now: it still presses, but does nothing */
    inactive?: boolean;
    /** 'alt' is steel blue, for a second action beside the main one */
    tone?: 'main' | 'alt';
    children: ReactNode;
}

/** The deck's main action: a chunky key with only an icon on it */
export function DeckKey({ label, onClick, inactive, tone = 'main', children }: DeckKeyProps) {
    const ack = useContext(DeckAckContext);
    return (
        <button
            type="button"
            className={clsx(styles.deckKey, tone === 'alt' && styles.deckKeyAlt)}
            {...press(!ack && inactive, ack ?? onClick)}
            aria-label={ack ? 'OK' : label}
            title={ack ? 'OK' : label}
        >
            {children}
        </button>
    );
}

/** A small grey pill, for lesser actions like Reset */
export function DeckPill({ label, onClick, inactive, children }: DeckKeyProps) {
    const ack = useContext(DeckAckContext);
    return (
        <button
            type="button"
            className={styles.pill}
            {...press(!ack && inactive, ack ?? onClick)}
            aria-label={ack ? 'OK' : label}
            title={ack ? 'OK' : label}
        >
            {children}
        </button>
    );
}
