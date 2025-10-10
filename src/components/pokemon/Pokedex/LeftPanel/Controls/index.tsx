import DPad from '@/components/console/DPad';
import SpriteControls from './SpriteControls';
import FlavorText from './FlavorText';
import styles from './styles.module.css';
import ReadButton from './ReadButton';

interface ControlsProps {
    spriteState: { front: boolean; shiny: boolean; female: boolean };
    toggleGender: () => void;
    toggleShiny: () => void;
    toggleFront: () => void;
    description: string;
    showFullDetails: boolean;
}

export default function LeftPanelControls({
    spriteState,
    toggleGender,
    toggleShiny,
    toggleFront,
    description,
    showFullDetails
}: ControlsProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: '2em' }}>
            <ReadButton text={description} isOwned={showFullDetails} />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '44%', gap: '3em' }}>
                <SpriteControls
                    spriteState={spriteState}
                    toggleGender={toggleGender}
                    toggleShiny={toggleShiny}
                    toggleFront={toggleFront}
                />
                <FlavorText flavorText={description} showFullDetails={showFullDetails} />
            </div>
            <DPad className={styles.pokedexDPad} />
        </div>
    );
}