import styles from '../styles.module.css'

interface IndividualValuesProps {
    renderStatBar: (value: number, max: number, type: 'stat' | 'ev' | 'iv') => React.ReactNode
    structure: {
        IVs: {
            hp: number
            attack: number
            defense: number
            speed: number
            special: number
        }
    }
}

export default function IndividualValues({ renderStatBar, structure }: IndividualValuesProps) {
    return (
        <div>
            <h3>Individual Values</h3>
            <div className={styles.statValue}>
                <span>HP:</span>
                {renderStatBar(structure.IVs.hp, 15, 'iv')}
                <span>{structure.IVs.hp}</span>
            </div>
            <div className={styles.statValue}>
                <span>ATK:</span>
                {renderStatBar(structure.IVs.attack, 15, 'iv')}
                <span>{structure.IVs.attack}</span>
            </div>
            <div className={styles.statValue}>
                <span>DEF:</span>
                {renderStatBar(structure.IVs.defense, 15, 'iv')}
                <span>{structure.IVs.defense}</span>
            </div>
            <div className={styles.statValue}>
                <span>SPE:</span>
                {renderStatBar(structure.IVs.speed, 15, 'iv')}
                <span>{structure.IVs.speed}</span>
            </div>
            <div className={styles.statValue}>
                <span>SPC:</span>
                {renderStatBar(structure.IVs.special, 15, 'iv')}
                <span>{structure.IVs.special}</span>
            </div>
        </div>)
}   