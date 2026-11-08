'use client';

import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { X } from 'lucide-react';
import Connector from '@/components/ui/Connector';
import { press, UI_MS } from '../stage';
import lab from '../lab.module.css';
import styles from './connectModal.module.css';

const STEPS = [
    'Verifying your account',
    'Assigning Trainer ID',
    'Patching save file',
    'Syncing with the Lab',
];

/** How long the monitor takes to drop into view, and to lift back out */
const DROP_MS = UI_MS * 2;

interface ConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    saveStateId: string;
    gameId: string;
    fetchSaveStates: (gId: string) => Promise<void>;
}

/**
 * A small Lab monitor, lowered into view over the page. Its lamps and key are hardware, so they
 * are always there: the lamps sit dark until a connection runs, and the key presses to no effect
 * while it's busy or done.
 */
export default function ConnectModal({ isOpen, onClose, saveStateId, gameId, fetchSaveStates }: ConnectModalProps) {
    const [phase, setPhase] = useState<'idle' | 'connecting' | 'done' | 'error'>('idle');
    const [stepIndex, setStepIndex] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');

    // Stays mounted after closing until the monitor has lifted out of view
    const [wasOpen, setWasOpen] = useState(isOpen);
    const [leaving, setLeaving] = useState(false);
    if (wasOpen !== isOpen) {
        setWasOpen(isOpen);
        setLeaving(!isOpen);
    }

    useEffect(() => {
        if (!leaving) return;
        const t = setTimeout(() => {
            setLeaving(false);
            setPhase('idle');
            setStepIndex(0);
            setErrorMsg('');
        }, DROP_MS);
        return () => clearTimeout(t);
    }, [leaving]);

    const isConnecting = phase === 'connecting';
    const isDone = phase === 'done';
    const isError = phase === 'error';

    const close = useCallback(() => {
        if (!isConnecting) onClose();
    }, [isConnecting, onClose]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            // Claimed before the Lab behind it reacts
            e.stopPropagation();
            close();
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, close]);

    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const keyRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (isOpen) keyRef.current?.focus({ preventScroll: true });
    }, [isOpen]);

    const handleConnect = useCallback(async () => {
        setPhase('connecting');
        setStepIndex(0);
        setErrorMsg('');

        const t1 = setTimeout(() => setStepIndex(s => Math.max(s, 1)), 900);
        const t2 = setTimeout(() => setStepIndex(s => Math.max(s, 2)), 2200);

        try {
            const res = await fetch(`/api/save-states/${saveStateId}/connect`, { method: 'POST' });
            clearTimeout(t1);
            clearTimeout(t2);

            if (res.ok) {
                setStepIndex(3);
                await fetchSaveStates(gameId);
                setPhase('done');
            } else {
                const body = await res.json().catch(() => ({}));
                setErrorMsg(body?.error ?? `Server error (${res.status})`);
                setPhase('error');
            }
        } catch {
            clearTimeout(t1);
            clearTimeout(t2);
            setErrorMsg('Network error — check the console.');
            setPhase('error');
        }
    }, [saveStateId, gameId, fetchSaveStates]);

    const stepState = (i: number): 'pending' | 'active' | 'done' | 'failed' => {
        if (isDone || (phase !== 'idle' && i < stepIndex)) return 'done';
        if (isConnecting && i === stepIndex) return 'active';
        if (isError && i === stepIndex) return 'failed';
        return 'pending';
    };

    if ((!isOpen && !leaving) || typeof document === 'undefined') return null;

    return createPortal(
        <div
            className={clsx(lab.hardware, styles.room, leaving && styles.leaving)}
            style={{ '--ui-ms': `${UI_MS}ms`, '--drop-ms': `${DROP_MS}ms` } as CSSProperties}
        >
            <div className={styles.overlay} onClick={close} />

            <section className={styles.shell} role="dialog" aria-modal="true" aria-label="Connect this Save File">
                <div className={styles.top}>
                    <span className={lab.monitorLed} aria-hidden />
                    <span className={lab.monitorVents} aria-hidden />
                    <button
                        type="button"
                        className={clsx(lab.rockerBtn, styles.closeBtn)}
                        {...press(isConnecting, close)}
                        aria-label="Close"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className={clsx(lab.screen, styles.screen)}>
                    <div className={lab.screenHeader}>
                        <span>Connect this Save File</span>
                    </div>

                    <div className={styles.connectorWrap}>
                        <Connector
                            connected={isDone}
                            plugColor="#a8f0da"
                            socketColor="#4ecdc4"
                            backdropColor="rgba(168, 240, 218, 0.08)"
                            width={280}
                            height={186}
                        />
                    </div>

                    <p className={styles.desc}>
                        This save file isn&apos;t connected to Oak&apos;s Lab yet. Connect it to transfer Pokémon in and out.{' '}
                        <a href="/lab/about" target="_blank" rel="noopener noreferrer" className={styles.link}>
                            Learn more about connecting
                        </a>
                    </p>

                    {/* Every stage is always listed, so the screen keeps its size; each brightens as it's reached */}
                    <ol className={styles.log} aria-label="Connection progress" aria-live="polite">
                        {STEPS.map((step, i) => {
                            const state = stepState(i);
                            return (
                                <li key={step} className={clsx(styles.logLine, styles[`log_${state}`])}>
                                    <span>{step}</span>
                                    <span className={styles.logStatus}>
                                        {state === 'done' ? 'OK' : state === 'active' ? '...' : state === 'failed' ? 'ERR' : ''}
                                    </span>
                                </li>
                            );
                        })}
                    </ol>

                    <p className={styles.error} role="alert">{isError ? errorMsg : ''}</p>
                </div>

                <div className={styles.controls}>
                    {/* A lamp per stage, in a row. The screen names them. */}
                    <div className={styles.lamps} aria-hidden>
                        {STEPS.map((step, i) => {
                            const state = stepState(i);
                            return (
                                <i
                                    key={step}
                                    className={clsx(
                                        lab.lamp,
                                        state === 'done' ? lab.lamp_on : lab.lamp_off,
                                        state === 'active' && styles.lampBlink,
                                        state === 'failed' && styles.lampFault,
                                    )}
                                />
                            );
                        })}
                    </div>

                    <button
                        ref={keyRef}
                        type="button"
                        className={styles.key}
                        {...press(isConnecting || isDone, handleConnect)}
                    >
                        Connect
                    </button>
                </div>
            </section>
        </div>,
        document.body,
    );
}
