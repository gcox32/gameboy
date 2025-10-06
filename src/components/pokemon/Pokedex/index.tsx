import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSRAMData } from '@/hooks/useSRAMData';
import { SRAMArray, GameModel } from '@/types';
import styles from './styles.module.css';
import Divider from './Divider';
import PokedexButton from './PokedexButton';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import { Pokemon as PokemonData } from '@/types/pokeapi/root';

interface PokedexProps {
    inGameMemory: SRAMArray | number[];
}

// Utility functions from the example
function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export default function Pokedex({ inGameMemory }: PokedexProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedPokemon, setSelectedPokemon] = useState<number | null>(null);
    const [pokemonData, setPokemonData] = useState<PokemonData | null>(null);
    const [description, setDescription] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [useDefault, setUseDefault] = useState(false);
    const [spriteState, setSpriteState] = useState({
        front: true,
        shiny: false,
        female: false
    });

    const {
        sramData,
        pokedex,
        isPokemonOwned,
        isPokemonSeen,
        isLoading,
        error,
        loadSRAM
    } = useSRAMData();

    // Load SRAM data when component mounts
    useEffect(() => {
        if (inGameMemory && inGameMemory.length > 0) {
            const sramArray = Array.isArray(inGameMemory) ? inGameMemory as SRAMArray : [];
            loadSRAM(sramArray);
        }
    }, [inGameMemory, loadSRAM]);

    // Calculate statistics
    const stats = useMemo(() => {
        if (!pokedex) return { owned: 0, seen: 0, total: 151, completion: 0 };

        let owned = 0;
        let seen = 0;

        for (let i = 0; i < 151; i++) {
            if (isPokemonOwned(i)) owned++;
            if (isPokemonSeen(i)) seen++;
        }

        const completion = Math.round((owned / 151) * 100);
        return { owned, seen, total: 151, completion };
    }, [pokedex, isPokemonOwned, isPokemonSeen]);

    // Generate Pokemon list (just numbers for now)
    const pokemonList = useMemo(() => {
        return Array.from({ length: 151 }, (_, i) => i + 1);
    }, []);

    // Load Pokemon data from PokeAPI
    const loadPokemonData = useCallback(async (pokemonId: number) => {
        
        // Start the API calls and minimum processing time in parallel
        const [apiData] = await Promise.all([
            // API calls
            (async () => {
                try {
                    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}/`, {
                        cache: "force-cache"
                    });
                    const data = await response.json();
                    // Load species data
                    const speciesResponse = await fetch(data.species.url);
                    const speciesData = await speciesResponse.json();
                    console.log(speciesData);

                    // Set description
                    const englishEntries = speciesData.flavor_text_entries.filter((e: any) => e.language.name === "en");
                    if (englishEntries.length > 0) {
                        setDescription(pickRandom(englishEntries.map((e: any) => e.flavor_text)));
                    }

                    return data;
                } catch (error) {
                    console.error('Error loading Pokemon data:', error);
                    throw error;
                }
            })()
        ]);

        setPokemonData(apiData);
    }, []);

    // Handle Pokemon selection
    const handlePokemonSelect = useCallback((pokemonId: number) => {
        setLoading(true);
        setTimeout(() => {
            setSelectedPokemon(pokemonId);
            setUseDefault(false);
            loadPokemonData(pokemonId);
            setLoading(false);
        }, 500 + Math.random() * 500);
    }, [loadPokemonData]);

    // Sprite controls
    const toggleGender = useCallback(() => {
        setSpriteState(prev => ({ ...prev, female: !prev.female }));
    }, []);

    const toggleShiny = useCallback(() => {
        setSpriteState(prev => ({ ...prev, shiny: !prev.shiny }));
    }, []);

    const toggleFront = useCallback(() => {
        setSpriteState(prev => ({ ...prev, front: !prev.front }));
    }, []);
    // Build sprite image path
    const buildSpritePath = useCallback((): string => {
        if (!pokemonData) return '/images/missingNo.png';
        const dir = spriteState.front ? "front" : "back";
        const gender = spriteState.female ? "_female" : "";
        const shiny = spriteState.shiny ? "_shiny" : "_default";
        const key = dir + shiny + gender;
        const spriteUrl = pokemonData.sprites[key as keyof typeof pokemonData.sprites];
        return (typeof spriteUrl === 'string' ? spriteUrl : pokemonData.sprites.front_default) || '/images/missingNo.png';
    }, [pokemonData, spriteState]);


    const handleClose = useCallback(() => {
        setIsExpanded(false);
        setUseDefault(true);
    }, []);


    return (
        <>
            {isExpanded ? (
            <div className={`${styles.pokedexContainer} ${isExpanded ? styles.expanded : ''}`}>
                <div className={styles.content}>
                    <div className={styles.detailedView}>
                        <LeftPanel
                            pokemonId={selectedPokemon}
                            isOwned={selectedPokemon ? isPokemonOwned(selectedPokemon - 1) : false}
                            isSeen={selectedPokemon ? isPokemonSeen(selectedPokemon - 1) : false}
                            pokemonData={pokemonData}
                            description={description}
                            buildSpritePath={buildSpritePath}
                            spriteState={spriteState}
                            toggleGender={toggleGender}
                            toggleShiny={toggleShiny}
                            toggleFront={toggleFront}
                            useDefault={useDefault}
                        />

                        <Divider />

                        <RightPanel
                            pokemonIds={pokemonList}
                            isPokemonOwned={isPokemonOwned}
                            isPokemonSeen={isPokemonSeen}
                            onSelect={handlePokemonSelect}
                            isProcessing={loading}
                            onClose={handleClose}
                        />
                    </div>
                </div>
            </div>
            ) : (
            <div className={`${styles.pokedexContainer} ${isExpanded ? styles.expanded : ''}`}>
                <div className={styles.header}>
                    <div className={styles.title}>
                        <h3>Pokédex</h3>
                        <div className={styles.stats}>
                            <span className={styles.stat}>{stats.seen} seen</span>
                        </div>
                        <div className={styles.stats}>
                            <span className={styles.stat}>{stats.owned} caught</span>
                        </div>
                    </div>
                    <PokedexButton onClick={() => {
                        setIsExpanded(!isExpanded);
                        setUseDefault(true);
                    }} />
                </div>
            </div>
            )}
        </>
    );
}