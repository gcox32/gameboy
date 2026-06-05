'use client';

import { useState, useEffect, useCallback } from 'react';
import BaseModal from '@/components/modals/BaseModal';
import Connector from '@/components/ui/Connector';
import styles from './styles.module.css';

const STEPS = [
    'Verifying your account',
    'Assigning Trainer ID',
    'Patching save file',
    'Syncing with Oak\'s Lab',
];

interface ConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    saveStateId: string;
    gameId: string;
    fetchSaveStates: (gId: string) => Promise<void>;
}

export default function ConnectModal({ isOpen, onClose, saveStateId, gameId, fetchSaveStates }: ConnectModalProps) {
    const [phase, setPhase] = useState<'idle' | 'connecting' | 'done' | 'error'>('idle');
    const [stepIndex, setStepIndex] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!isOpen) {
            const t = setTimeout(() => {
                setPhase('idle');
                setStepIndex(0);
                setErrorMsg('');
            }, 300);
            return () => clearTimeout(t);
        }
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
    }, [saveStateId, gameId, fetchSaveStates, onClose]);

    const isConnecting = phase === 'connecting';
    const isDone = phase === 'done';
    const isError = phase === 'error';
    const showSteps = phase !== 'idle';

    return (
        <BaseModal isOpen={isOpen} onClose={isConnecting ? () => {} : onClose} title="Connect this Save File" size="md">
            <div className={styles.connectModalBody}>
                <div className={styles.connectorWrap}>
                    <Connector
                        connected={isDone}
                        plugColor="#c8a0f0"
                        socketColor="#7b68a6"
                        width={340}
                        height={226}
                    />
                </div>
                <p className={styles.connectModalDesc}>
                    This save file isn&apos;t connected to Oak&apos;s Lab yet. Connect it to transfer Pokémon in and out.{' '}
                    <a href="/lab/about" target="_blank" rel="noopener noreferrer" className={styles.connectModalLink}>
                        Learn more about connecting
                    </a>
                </p>

                {showSteps && (
                    <div className={styles.connectSteps}>
                        {STEPS.map((step, i) => {
                            const isActive = isConnecting && i === stepIndex;
                            const isPast = i < stepIndex;
                            const isComplete = isDone || isPast;
                            const isStepError = isError && i === stepIndex;
                            return (
                                <div
                                    key={i}
                                    className={[
                                        styles.connectStep,
                                        isActive ? styles.stepActive : '',
                                        isComplete ? styles.stepComplete : '',
                                        isStepError ? styles.stepError : '',
                                    ].join(' ')}
                                >
                                    <div className={styles.stepDot} />
                                    <span>{step}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {isError && <p className={styles.connectModalError}>{errorMsg}</p>}

                <div className={styles.connectModalActions}>
                    <button
                        className={styles.btnPrimary}
                        onClick={handleConnect}
                        disabled={isConnecting || isDone}
                    >
                        {isDone ? 'Connected!' : isConnecting ? 'Connecting...' : isError ? 'Try Again' : 'Connect'}
                    </button>
                </div>
            </div>
        </BaseModal>
    );
}
