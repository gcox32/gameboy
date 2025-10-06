import styles from './styles.module.css';
import { FaVenus, FaUndo } from 'react-icons/fa';

interface SpriteControlsProps {
    spriteState: { front: boolean; shiny: boolean; female: boolean };
    toggleGender: () => void;
    toggleShiny: () => void;
    toggleFront: () => void;
}

export default function SpriteControls({ spriteState, toggleGender, toggleShiny, toggleFront }: SpriteControlsProps) {

    return (
        <div className={styles.spriteControls}>
            <div
                className={`${styles.spriteControl} ${spriteState.female ? styles.selected : ''}`}
                onClick={toggleGender}
            >
                <FaVenus />
            </div>
            <div
                className={`${styles.spriteControl} ${spriteState.shiny ? styles.selected : ''}`}
                onClick={toggleShiny}
            >
                <span>shiny</span>
            </div>
            <div
                className={`${styles.spriteControl} ${!spriteState.front ? styles.selected : ''}`}
                onClick={toggleFront}
            >
                <FaUndo />
            </div>
        </div>

    )
}