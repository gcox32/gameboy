'use client';

import { RefObject, useRef, useEffect, useCallback } from 'react';
import { defaultKeyMappings } from '@/contexts/SettingsContext';
import styles from './styles.module.css';

interface NewMobileControlsProps {
    mainCanvasRef: RefObject<HTMLCanvasElement>;
    isEmulatorOn: boolean;
}

// Bypasses React state for visual feedback — classList change is synchronous.
// Also calls preventDefault() on touch to eliminate the ~300ms iOS active delay.
function TouchButton({
    button,
    className,
    label,
}: {
    button: string;
    className: string;
    label?: string;
}) {
    const divRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const mapping = defaultKeyMappings.find(m => m.button === button);

    const dispatchKey = useCallback((type: 'keydown' | 'keyup') => {
        if (!mapping) return;
        document.dispatchEvent(new KeyboardEvent(type, {
            bubbles: true,
            cancelable: true,
            key: mapping.key,
            keyCode: mapping.keyCode,
        }));
    }, [mapping]);

    const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        divRef.current?.classList.add(styles.pressed);
        if (navigator.vibrate) navigator.vibrate(30);
        intervalRef.current = setInterval(() => dispatchKey('keydown'), 10);
    }, [dispatchKey]);

    const handleEnd = useCallback(() => {
        divRef.current?.classList.remove(styles.pressed);
        dispatchKey('keyup');
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, [dispatchKey]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return (
        <div
            ref={divRef}
            className={className}
            onMouseDown={handleStart}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchEnd={handleEnd}
            onTouchCancel={handleEnd}
        >
            {label && <span className={styles.buttonLabel}>{label}</span>}
        </div>
    );
}

export default function NewMobileControls({ mainCanvasRef, isEmulatorOn }: NewMobileControlsProps) {
    return (
        <div className={styles.console}>
            <div className={styles.screenSection}>
                <div className={styles.screenBezel}>
                    <div className={styles.screenWindow}>
                        <canvas
                            ref={mainCanvasRef}
                            className={styles.lcdCanvas}
                            width="160"
                            height="144"
                            style={{ visibility: isEmulatorOn ? 'visible' : 'hidden' }}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.controlsSection}>
                <div className={styles.dpadContainer}>
                    <TouchButton className={`${styles.dpadCell} ${styles.dpadUp}`} button="up" />
                    <div className={styles.dpadMiddleRow}>
                        <TouchButton className={`${styles.dpadCell} ${styles.dpadLeft}`} button="left" />
                        <div className={`${styles.dpadCell} ${styles.dpadCenter}`} />
                        <TouchButton className={`${styles.dpadCell} ${styles.dpadRight}`} button="right" />
                    </div>
                    <TouchButton className={`${styles.dpadCell} ${styles.dpadDown}`} button="down" />
                </div>

                <div className={styles.abContainer}>
                    <TouchButton className={`${styles.abButton} ${styles.aButton}`} button="a" label="A" />
                    <TouchButton className={`${styles.abButton} ${styles.bButton}`} button="b" label="B" />
                </div>

                <div className={styles.optionsContainer}>
                    <div className={styles.optionGroup}>
                        <TouchButton className={styles.optionButton} button="select" />
                        <span className={styles.optionLabel}>SELECT</span>
                    </div>
                    <div className={styles.optionGroup}>
                        <TouchButton className={styles.optionButton} button="start" />
                        <span className={styles.optionLabel}>START</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
