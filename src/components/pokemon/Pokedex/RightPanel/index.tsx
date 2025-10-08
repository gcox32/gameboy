import React from 'react';
import styles from '../styles.module.css';
import BlueButtons from './BlueButtons';
import ListView from './ListView';
import Controls from './Controls';
import DualScreens from './DualScreens';

interface RightPanelProps {
    pokemonIds: number[];
    isPokemonOwned: (index: number) => boolean;
    isPokemonSeen: (index: number) => boolean;
    onSelect: (pokemonId: number) => void;
    isProcessing?: boolean;
    onClose: () => void;
}

export default function RightPanel({ pokemonIds, isPokemonOwned, isPokemonSeen, onSelect, isProcessing = false, onClose }: RightPanelProps) {
    return (
        <div className={styles.rightPanel}>
            <ListView 
                pokemonIds={pokemonIds} 
                isPokemonOwned={isPokemonOwned} 
                isPokemonSeen={isPokemonSeen} 
                onSelect={onSelect} 
            />
            <BlueButtons isProcessing={isProcessing} />
            <Controls onClick={onClose} />
            <DualScreens />
        </div>
    );
}


