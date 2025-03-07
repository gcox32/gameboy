import styles from '../styles.module.css'

interface CurrentStatsProps {
    renderStatBar: (value: number, max: number, type: 'stat' | 'ev' | 'iv') => React.ReactNode
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

export default function CurrentStats({ renderStatBar, structure }: CurrentStatsProps) {
    return (
        <div>
        <h3>Stats</h3>
        <div className={styles.statValue}>
            <span style={{ marginRight: "1em" }}>HP:</span>
            {renderStatBar(structure.levelStats.maxHP, 255, 'stat')}
            <span>{structure.levelStats.maxHP}</span>
        </div>
        <div className={styles.statValue}>
            <span>ATK:</span>
            {renderStatBar(structure.levelStats.attack, 255, 'stat')}
            <span>{structure.levelStats.attack}</span>
        </div>
        <div className={styles.statValue}>
            <span>DEF:</span>
            {renderStatBar(structure.levelStats.defense, 255, 'stat')}
            <span>{structure.levelStats.defense}</span>
        </div>
        <div className={styles.statValue}>
            <span>SPE:</span>
            {renderStatBar(structure.levelStats.speed, 255, 'stat')}
            <span>{structure.levelStats.speed}</span>
        </div>
        <div className={styles.statValue}>
            <span>SPC:</span>
            {renderStatBar(structure.levelStats.special, 255, 'stat')}
            <span>{structure.levelStats.special}</span>
        </div>
    </div>
    )
}