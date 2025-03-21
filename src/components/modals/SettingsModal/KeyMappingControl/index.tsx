import React, { useState, useEffect } from 'react';
import { KeyMapping } from '@/contexts/SettingsContext';
import styles from './styles.module.css';

interface KeyMappingControlProps {
    mappings: KeyMapping[];
    onChange: (newMappings: KeyMapping[]) => void;
}

const keyLabels: Record<string, string> = {
    right: "→ Right",
    left: "← Left",
    up: "↑ Up",
    down: "↓ Down",
    a: "A Button",
    b: "B Button",
    select: "Select",
    start: "Start"
};

export default function KeyMappingControl({ mappings, onChange }: KeyMappingControlProps) {
    const [listeningFor, setListeningFor] = useState<string | null>(null);

    useEffect(() => {
        if (listeningFor) {
            const handleKeyDown = (event: KeyboardEvent) => {
                const mapping = mappings.find(m => m.key === listeningFor);
                if (mapping) {
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
                }
            };

            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [listeningFor, mappings, onChange]);

    return (
        <div className={styles.keyMappingContainer}>
            {mappings.map((mapping) => (
                <div key={mapping.key} className={styles.keyMappingRow}>
                    <span className={styles.keyLabel}>
                        {keyLabels[mapping.button] || mapping.button}
                    </span>
                    <button
                        className={`${styles.keyMappingButton} ${
                            listeningFor === mapping.key ? styles.listening : ''
                        }`}
                        onClick={() => setListeningFor(mapping.key)}
                    >
                        {listeningFor === mapping.key ? 
                            'Press a key' : 
                            mapping.key.length > 1 ? mapping.key : mapping.key.toUpperCase()}
                    </button>
                </div>
            ))}
        </div>
    );
}