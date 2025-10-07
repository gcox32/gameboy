import DPad from '@/components/console/DPad';
import SpriteControls from './SpriteControls';
import styles from '../../styles.module.css';

interface ControlsProps {
    spriteState: { front: boolean; shiny: boolean; female: boolean };
    toggleGender: () => void;
    toggleShiny: () => void;
    toggleFront: () => void;
}

export default function LeftPanelControls({
    spriteState,
    toggleGender,
    toggleShiny,
    toggleFront
}: ControlsProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: '10px' }}>
            <div className={styles.controls}>
                <SpriteControls
                    spriteState={spriteState}
                    toggleGender={toggleGender}
                    toggleShiny={toggleShiny}
                    toggleFront={toggleFront}
                />
                <DPad />
            </div>
        </div>
    );
}