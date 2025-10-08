import React from 'react';
import styles from '../styles.module.css';
import PokedexButton from '../PokedexButton';
import BlueButtons from './BlueButtons';
import ListView from './ListView';

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
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'end', alignItems: 'end' }}>
                <PokedexButton onClick={onClose} />
            </div>
        </div>
    );
}


