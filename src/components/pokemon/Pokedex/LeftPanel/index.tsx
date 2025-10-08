import React from 'react';
import styles from '../styles.module.css';
import { dexDict } from '@/utils/pokemon/dicts';
import { Pokemon as PokemonData } from '@/types/pokeapi/root';
import SpriteControls from './Controls/SpriteControls';
import DPad from '@/components/console/DPad';
import SpriteFrame from './SpriteFrame';
import LeftPanelControls from './Controls';

interface LeftPanelProps {
    pokemonId: number | null;
    isOwned: boolean;
    isSeen: boolean;
    pokemonData: PokemonData | null; // PokeAPI data
    description: string;
    buildSpritePath: () => string;
    spriteState: { front: boolean; shiny: boolean; female: boolean };
    toggleGender: () => void;
    toggleShiny: () => void;
    toggleFront: () => void;
    useDefault: boolean;
}

// Helper function to find Pokemon name by pokedexNo
function getPokemonNameByPokedexNo(pokedexNo: number): string | null {
    const pokedexNoStr = pokedexNo.toString().padStart(3, '0');
    for (const [index, data] of Object.entries(dexDict)) {
        if (data.pokedexNo === pokedexNoStr) {
            return data.name.toUpperCase();
        }
    }
    return null;
}

export default function LeftPanel({
    pokemonId,
    isOwned,
    isSeen,
    pokemonData,
    description,
    buildSpritePath,
    spriteState,
    toggleGender,
    toggleShiny,
    toggleFront,
    useDefault = false
}: LeftPanelProps) {
    // Get Pokemon name from dexDict using pokedexNo
    const pokemonName = pokemonId ? getPokemonNameByPokedexNo(pokemonId) || 'Unknown' : 'Unknown';

    // Show different levels of detail based on ownership
    const showFullDetails = isOwned;
    const showBasicDetails = isSeen || isOwned;
    const showUnknownSprite = !isSeen && !isOwned;

    return (
        <div className={styles.leftPanel}>
            {/* <div className={styles.pokemonName}>
                {showBasicDetails ? pokemonName : ''}
            </div> */}
            <div className={styles.pokemonSprite}>
                <SpriteFrame
                    useDefault={useDefault}
                    showUnknownSprite={showUnknownSprite}
                    buildSpritePath={buildSpritePath}
                    pokemonId={pokemonId}
                    isOwned={isOwned}
                />
                <LeftPanelControls
                    spriteState={spriteState}
                    toggleGender={toggleGender}
                    toggleShiny={toggleShiny}
                    toggleFront={toggleFront}
                    description={description}
                    showFullDetails={showFullDetails}
                />
            </div>
        </div>
    );
}


