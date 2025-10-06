import React from 'react';
import Image from 'next/image';
import styles from '../styles.module.css';
import { dexDict } from '@/utils/pokemon/dicts';
import { Pokemon as PokemonData } from '@/types/pokeapi/root';
import SpriteControls from './SpriteControls';
import CryButton from './CryButton';

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

// Default/blank Pokemon sprite component
function DefaultPokemonSprite() {
    return (
        <div className={styles.defaultSprite}>
            {/* Empty div to maintain shape */}
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
    toggleFront,
    useDefault
}: LeftPanelProps) {
    // Handle default view
    if (useDefault) {
        return (
            <div className={styles.leftPanel}>
                <div className={styles.pokemonName}>
                    {/* Empty div to maintain shape */}
                </div>
                <div className={styles.pokemonSprite}>
                    <DefaultPokemonSprite />
                </div>
                <div className={styles.pokemonDescription}>
                    {/* Empty div to maintain shape */}
                </div>
            </div>
        );
    }

    // Get Pokemon name from dexDict using pokedexNo
    const pokemonName = pokemonId ? getPokemonNameByPokedexNo(pokemonId) || 'Unknown' : 'Unknown';
    
    // Show different levels of detail based on ownership
    const showFullDetails = isOwned;
    const showBasicDetails = isSeen || isOwned;
    const showUnknownSprite = !isSeen && !isOwned;

    return (
        <div className={styles.leftPanel}>
            <div className={styles.pokemonName}>
                {showBasicDetails ? pokemonName : ''}
            </div>
            <div className={styles.pokemonSprite}>
                {showUnknownSprite ? (
                    <UnknownPokemonSprite />
                ) : (
                    <Image 
                        src={buildSpritePath()} 
                        alt="pokemon" 
                        className={styles.spriteImage} 
                        width={300} 
                        height={300} 
                        onError={(e) => {
                            e.currentTarget.src = '/images/pokemon/unknown.png';
                        }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: '10px' }}>
                <CryButton pokemonId={pokemonId} owned={isOwned} />
                <SpriteControls 
                    spriteState={spriteState}  
                    toggleGender={toggleGender} 
                    toggleShiny={toggleShiny} 
                    toggleFront={toggleFront} 
                />
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


