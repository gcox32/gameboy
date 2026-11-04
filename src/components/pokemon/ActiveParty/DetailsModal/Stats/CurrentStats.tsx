import { ReactNode } from 'react';
import styles from '../styles.module.css'

interface CurrentStatsProps {
    renderStatBar: (value: number, max: number, type: 'stat' | 'ev' | 'iv') => ReactNode
    structure: {
        levelStats: {
            maxHP: number
            attack: number
            defense: number
            speed: number
            special: number
        }
    }
}

// Bar scale only. Very high stats (e.g. Chansey's HP) fill the bar; the number stays exact.
const STAT_BAR_MAX = 500;

export default function CurrentStats({ renderStatBar, structure }: CurrentStatsProps) {
    return (
        <div>
        <h3>Stats</h3>
        <div className={styles.statValue}>
            <span>HP:</span>
            {renderStatBar(structure.levelStats.maxHP, STAT_BAR_MAX, 'stat')}
            <span>{structure.levelStats.maxHP}</span>
        </div>
        <div className={styles.statValue}>
            <span>ATK:</span>
            {renderStatBar(structure.levelStats.attack, STAT_BAR_MAX, 'stat')}
            <span>{structure.levelStats.attack}</span>
        </div>
        <div className={styles.statValue}>
            <span>DEF:</span>
            {renderStatBar(structure.levelStats.defense, STAT_BAR_MAX, 'stat')}
            <span>{structure.levelStats.defense}</span>
        </div>
        <div className={styles.statValue}>
            <span>SPE:</span>
            {renderStatBar(structure.levelStats.speed, STAT_BAR_MAX, 'stat')}
            <span>{structure.levelStats.speed}</span>
        </div>
        <div className={styles.statValue}>
            <span>SPC:</span>
            {renderStatBar(structure.levelStats.special, STAT_BAR_MAX, 'stat')}
            <span>{structure.levelStats.special}</span>
        </div>
    </div>
    )
}