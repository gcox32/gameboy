import React from 'react';
import { FaEye, FaEyeSlash, FaCheck } from 'react-icons/fa';
import styles from './styles.module.css';
import PokedexButton from './PokedexButton';
import BlueButtons from './BlueButtons';
import { dexDict } from '@/utils/pokemon/dicts';

interface RightPanelProps {
    pokemonIds: number[];
    isPokemonOwned: (index: number) => boolean;
    isPokemonSeen: (index: number) => boolean;
    onSelect: (pokemonId: number) => void;
    isExpanded: boolean;
    setIsExpanded: (isExpanded: boolean) => void;
}

// Helper function to find Pokemon name by pokedexNo
function getPokemonNameByPokedexNo(pokedexNo: number): string | null {
    const pokedexNoStr = pokedexNo.toString().padStart(3, '0');
    for (const [index, data] of Object.entries(dexDict)) {
        if (data.pokedexNo === pokedexNoStr) {
            return data.name.toUpperCase().padStart(18, '.');
        }
    }
    return null;
}

export default function RightPanel({ pokemonIds, isPokemonOwned, isPokemonSeen, onSelect, isExpanded, setIsExpanded }: RightPanelProps) {
    return (
        <div className={styles.rightPanel}>
            <div className={styles.pokemonListScreen}>
                <div className={styles.pokemonList}>
                    {pokemonIds.map((pokemonId) => {
                        const owned = isPokemonOwned(pokemonId - 1);
                        const seen = isPokemonSeen(pokemonId - 1);
                        
                        // Get Pokemon name from dexDict if seen or owned
                        const pokemonName = (seen || owned) ? getPokemonNameByPokedexNo(pokemonId) : null;

                        return (
                            <div
                                key={pokemonId}
                                className={`${styles.pokemonListItem} ${owned ? styles.owned : seen ? styles.seen : styles.unseen}`}
                                onClick={() => onSelect(pokemonId)}
                            >
                                <div className={styles.pokemonListInfo}>
                                    <div className={styles.pokemonListNumber}>
                                        {`#${pokemonId.toString().padStart(3, '0')}`} {pokemonName ? ` ${pokemonName}` : '.'.repeat(18)} 
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <BlueButtons />
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'end', alignItems: 'end' }}>
                <PokedexButton className={styles.toggleButton} onClick={() => setIsExpanded(!isExpanded)} />
            </div>
        </div>
    );
}


