import React, { useState, useEffect } from 'react';
import styles from '../styles.module.css';

export default function BlueButtons({ isProcessing = false }: { isProcessing?: boolean }) {
    const [activeButtons, setActiveButtons] = useState<number[]>([]);

    useEffect(() => {
        if (!isProcessing) {
            setActiveButtons([]);
            return;
        }

        const interval = setInterval(() => {
            // Randomly select 2-5 buttons to light up
            const numActive = Math.floor(Math.random() * 4) + 2; // 2-5 buttons
            const newActiveButtons: number[] = [];
            
            while (newActiveButtons.length < numActive) {
                const randomIndex = Math.floor(Math.random() * 10);
                if (!newActiveButtons.includes(randomIndex)) {
                    newActiveButtons.push(randomIndex);
                }
            }
            
            setActiveButtons(newActiveButtons);
        }, 50 + Math.random() * 100); // Random interval between 50-100ms

        return () => clearInterval(interval);
    }, [isProcessing]);

    return (
        <div className={styles.panelRow + ' ' + styles.blueButtons}>
            {Array.from({ length: 10 }, (_, index) => (
                <div 
                    key={index}
                    className={`${styles.blueButton} ${activeButtons.includes(index) ? styles.blueButtonActive : ''}`} 
                />
            ))}
        </div>
    );
}