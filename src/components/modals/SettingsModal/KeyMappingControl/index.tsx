import React, { useState } from 'react';
import { KeyMapping } from '@/contexts/SettingsContext';
import styles from './styles.module.css';

interface KeyMappingControlProps {
    mappings: KeyMapping[];
    onChange: (newMappings: KeyMapping[]) => void;
}

const keyLabels: Record<string, string> = {
    right: "Right",
    left: "Left",
    up: "Up",
    down: "Down",
    a: "A Button",
    b: "B Button",
    select: "Select",
    start: "Start"
};

export default function KeyMappingControl({ mappings, onChange }: KeyMappingControlProps) {
    const [listeningFor, setListeningFor] = useState<string | null>(null);

    const handleKeyPress = (event: KeyboardEvent, mapping: KeyMapping) => {
        event.preventDefault();
        const keyPressed = event.key;
        
        // Don't allow duplicate key mappings
        const isKeyUsed = mappings.some(m => 
            m.key !== mapping.key && m.key === keyPressed
        );

        if (!isKeyUsed) {
            const newMappings = mappings.map(m => {
                if (m.key === mapping.key) {
                    return {
                        ...m,
                        keyCode: event.keyCode,
                        key: keyPressed
                    };
                }
                return m;
            });
            onChange(newMappings);
        }
        setListeningFor(null);
    };

    const startListening = (key: string) => {
        setListeningFor(key);
        const handleKeyDown = (event: KeyboardEvent) => {
            const mapping = mappings.find(m => m.key === key);
            if (mapping) {
                handleKeyPress(event, mapping);
            }
            window.removeEventListener('keydown', handleKeyDown);
        };
        window.addEventListener('keydown', handleKeyDown);
    };

    return (
        <div className={styles.keyMappingContainer}>
            {mappings.map((mapping) => (
                <div key={mapping.key} className={styles.keyMappingRow}>
                    <span className={styles.keyLabel}>{mapping.button}</span>
                    <button
                        className={styles.keyMappingButton}
                        onClick={() => startListening(mapping.key)}
                    >
                        {listeningFor === mapping.key ? 
                            'Press a key...' : 
                            mapping.key}
                    </button>
                </div>
            ))}
        </div>
    );
}