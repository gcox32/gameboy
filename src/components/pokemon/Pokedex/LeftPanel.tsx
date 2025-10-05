import React from 'react';
import Image from 'next/image';
import { FaVenus, FaUndo } from 'react-icons/fa';
import styles from './styles.module.css';
import { dexDict } from '@/utils/pokemon/dicts';

interface LeftPanelProps {
    pokemonId: number;
    isOwned: boolean;
    isSeen: boolean;
    pokemonData: any; // PokeAPI data
    description: string;
    buildSpritePath: () => string;
    spriteState: { front: boolean; shiny: boolean; female: boolean };
    toggleGender: () => void;
    toggleShiny: () => void;
    toggleFront: () => void;
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

// Unknown Pokemon sprite component
function UnknownPokemonSprite() {
    return (
        <div className={styles.unknownSprite}>
            <div className={styles.unknownIcon}>
                <div className={styles.questionMark}>?</div>
            </div>
        </div>
    );
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
    toggleFront
}: LeftPanelProps) {
    // Get Pokemon name from dexDict using pokedexNo
    const pokemonName = getPokemonNameByPokedexNo(pokemonId) || 'Unknown';

    // Show different levels of detail based on ownership
    const showFullDetails = isOwned;
    const showBasicDetails = isSeen || isOwned;
    const showUnknownSprite = !isSeen && !isOwned;

    return (
        <div className={styles.leftPanel}>
            <div className={styles.pokemonName}>
                {showBasicDetails ? pokemonName : '?????'}
            </div>
            <div className={styles.pokemonSprite}>
                {showUnknownSprite ? (
                    <UnknownPokemonSprite />
                ) : (
                    <Image src={buildSpritePath()} alt="pokemon" className={styles.spriteImage} width={300} height={300} />
                )}
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
            </div>
            <div className={styles.pokemonDescription}>
                {showFullDetails && (
                    <>{description}</>
                )}
            </div>
        </div>
    );
}


