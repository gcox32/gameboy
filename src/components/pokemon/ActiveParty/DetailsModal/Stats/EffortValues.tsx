import { ReactNode } from 'react';
import styles from '../styles.module.css'

interface EffortValuesProps {
    renderStatBar: (value: number, max: number, type: 'stat' | 'ev' | 'iv') => ReactNode
    structure: {
        EVs: {
            hp: number
            attack: number
            defense: number
            speed: number
            special: number
        }
    }
}

const EV_MAX = 65535;

function formatEvFraction(value: number): string {
    return (value / EV_MAX).toFixed(2);
}

export default function EffortValues({ renderStatBar, structure }: EffortValuesProps) {
    return (
        <div>
            <h3>Effort Values</h3>
            <div className={styles.statValue}>
                <span>HP:</span>
                {renderStatBar(structure.EVs.hp, EV_MAX, 'ev')}
                <span>{formatEvFraction(structure.EVs.hp)}</span>
            </div>
            <div className={styles.statValue}>
                <span>ATK:</span>
                {renderStatBar(structure.EVs.attack, EV_MAX, 'ev')}
                <span>{formatEvFraction(structure.EVs.attack)}</span>
            </div>
            <div className={styles.statValue}>
                <span>DEF:</span>
                {renderStatBar(structure.EVs.defense, EV_MAX, 'ev')}
                <span>{formatEvFraction(structure.EVs.defense)}</span>
            </div>
            <div className={styles.statValue}>
                <span>SPE:</span>
                {renderStatBar(structure.EVs.speed, EV_MAX, 'ev')}
                <span>{formatEvFraction(structure.EVs.speed)}</span>
            </div>
            <div className={styles.statValue}>
                <span>SPC:</span>
                {renderStatBar(structure.EVs.special, EV_MAX, 'ev')}
                <span>{formatEvFraction(structure.EVs.special)}</span>
            </div>
        </div>
    )
}