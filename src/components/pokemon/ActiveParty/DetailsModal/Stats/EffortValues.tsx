import styles from '../styles.module.css'

interface EffortValuesProps {
    renderStatBar: (value: number, max: number, type: 'stat' | 'ev' | 'iv') => React.ReactNode
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

export default function EffortValues({ renderStatBar, structure }: EffortValuesProps) {
    return (
        <div>
            <h3>Effort Values</h3>
            <div className={styles.statValue}>
                <span>HP:</span>
                {renderStatBar(structure.EVs.hp, 65535, 'ev')}
                <span>{structure.EVs.hp}</span>
            </div>
            <div className={styles.statValue}>
                <span>ATK:</span>
                {renderStatBar(structure.EVs.attack, 65535, 'ev')}
                <span>{structure.EVs.attack}</span>
            </div>
            <div className={styles.statValue}>
                <span>DEF:</span>
                {renderStatBar(structure.EVs.defense, 65535, 'ev')}
                <span>{structure.EVs.defense}</span>
            </div>
            <div className={styles.statValue}>
                <span>SPE:</span>
                {renderStatBar(structure.EVs.speed, 65535, 'ev')}
                <span>{structure.EVs.speed}</span>
            </div>
            <div className={styles.statValue}>
                <span>SPC:</span>
                {renderStatBar(structure.EVs.special, 65535, 'ev')}
                <span>{structure.EVs.special}</span>
            </div>
        </div>
    )
}