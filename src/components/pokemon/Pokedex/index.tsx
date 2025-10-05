import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSRAMData } from '@/hooks/useSRAMData';
import { SRAMArray, GameModel } from '@/types';
import styles from './styles.module.css';
import { FaEye, FaEyeSlash, FaCheck, FaVenus, FaUndo } from 'react-icons/fa';
import Divider from './Divider';
import PokedexButton from './PokedexButton';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import Image from 'next/image';

interface PokedexProps {
    inGameMemory: SRAMArray | number[];
    activeROM: GameModel;
}

interface PokemonData {
    id: number;
    name: string;
    sprites: {
        front_default: string;
        back_default: string;
        front_shiny: string;
        back_shiny: string;
        front_female?: string;
        back_female?: string;
        front_shiny_female?: string;
        back_shiny_female?: string;
    };
    types: Array<{ type: { name: string } }>;
    stats: Array<{ stat: { name: string }; base_stat: number }>;
    moves: PokemonMove[];
}

interface SpeciesData {
    flavor_text_entries: Array<{ flavor_text: string; language: { name: string } }>;
    evolution_chain: { url: string };
}

interface MoveData {
    name: string;
    accuracy: number;
    power: number;
    pp: number;
    type: { name: string };
    names: Array<{ name: string; language: { name: string } }>;
}

interface PokemonMove {
    move: { name: string; url: string };
    version_group_details: Array<{ level_learned_at: number }>;
}

// Utility functions from the example
function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function padStats(stat: string, val: number | string, sep: string, len: number): string {
    val = val || "xx";
    return `${stat.toString()}${sep.repeat(len - (val.toString().length + stat.toString().length))}${val.toString()}`;
}

export default function Pokedex({ inGameMemory, activeROM }: PokedexProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'owned' | 'seen' | 'unseen'>('all');
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedPokemon, setSelectedPokemon] = useState<number | null>(null);
    const [pokemonData, setPokemonData] = useState<PokemonData | null>(null);
    const [speciesData, setSpeciesData] = useState<SpeciesData | null>(null);
    const [description, setDescription] = useState<string>('');
    const [evoSprites, setEvoSprites] = useState<string[]>([]);
    const [evoNames, setEvoNames] = useState<string[]>([]);
    const [moves, setMoves] = useState<PokemonMove[]>([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [currentMove, setCurrentMove] = useState<MoveData | null>(null);
    const [loading, setLoading] = useState(false);
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

    // Filter Pokemon based on search and filter criteria
    const filteredPokemon = useMemo(() => {
        return pokemonList.filter(pokemonId => {
            const matchesSearch = pokemonId.toString().includes(searchTerm) ||
                `#${pokemonId.toString().padStart(3, '0')}`.includes(searchTerm);

            let matchesFilter = true;
            if (filterType === 'owned') {
                matchesFilter = isPokemonOwned(pokemonId - 1);
            } else if (filterType === 'seen') {
                matchesFilter = isPokemonSeen(pokemonId - 1);
            } else if (filterType === 'unseen') {
                matchesFilter = !isPokemonSeen(pokemonId - 1);
            }

            return matchesSearch && matchesFilter;
        });
    }, [pokemonList, searchTerm, filterType, isPokemonOwned, isPokemonSeen]);

    // Load Pokemon data from PokeAPI
    const loadPokemonData = useCallback(async (pokemonId: number) => {
        setLoading(true);
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}/`, {
                cache: "force-cache"
            });
            const data = await response.json();
            setPokemonData(data);

            // Load species data
            const speciesResponse = await fetch(data.species.url);
            const speciesData = await speciesResponse.json();
            setSpeciesData(speciesData);

            // Set description
            const englishEntries = speciesData.flavor_text_entries.filter((e: any) => e.language.name === "en");
            if (englishEntries.length > 0) {
                setDescription(pickRandom(englishEntries.map((e: any) => e.flavor_text)));
            }

            // Load evolution chain
            const evoResponse = await fetch(speciesData.evolution_chain.url);
            const evoData = await evoResponse.json();

            const evos = [];
            const first = evoData.chain;
            let second, third;

            if (first) {
                evos.push(fetch(`https://pokeapi.co/api/v2/pokemon/${first.species.name}/`));
                second = first.evolves_to[0];
            }
            if (second) {
                evos.push(fetch(`https://pokeapi.co/api/v2/pokemon/${second.species.name}/`));
                third = second.evolves_to[0];
            }
            if (third) {
                evos.push(fetch(`https://pokeapi.co/api/v2/pokemon/${third.species.name}/`));
            }

            const evoResponses = await Promise.all(evos);
            const evoDataList = await Promise.all(evoResponses.map(r => r.json()));
            const sprites = evoDataList.map(v => v.sprites.front_default);
            const names = evoDataList.map(n => n.name);
            setEvoSprites(sprites);
            setEvoNames(names);

            // Load moves
            setMoves(data.moves);
            setCurrentMoveIndex(0);
        } catch (error) {
            console.error('Error loading Pokemon data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle Pokemon selection
    const handlePokemonSelect = useCallback((pokemonId: number) => {
        setSelectedPokemon(pokemonId);
        loadPokemonData(pokemonId);
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
    const buildSpritePath = useCallback(() => {
        if (!pokemonData) return '';
        const dir = spriteState.front ? "front" : "back";
        const gender = spriteState.female ? "_female" : "";
        const shiny = spriteState.shiny ? "_shiny" : "_default";
        const key = dir + shiny + gender;
        return pokemonData.sprites[key as keyof typeof pokemonData.sprites] || pokemonData.sprites.front_default;
    }, [pokemonData, spriteState]);

    // Pre-select a default Pokémon when expanded
    useEffect(() => {
        if (isExpanded && !pokemonData && !loading) {
            const defaultId = selectedPokemon || 1;
            handlePokemonSelect(defaultId);
        }
    }, [isExpanded, pokemonData, loading, selectedPokemon, handlePokemonSelect]);

    if (isLoading) {
        return (
            <div className={styles.pokedexContainer}>
                <div className={styles.loading}>Loading Pokédex...</div>
            </div>
        );
    }

    if (error || !pokedex) {
        console.log('Error loading Pokédex data:', error);
        return (
            <div className={styles.pokedexContainer}>
                <div className={styles.error}>No Pokédex data available</div>
            </div>
        );
    }

    return (

        <>
            {isExpanded ? (
            <div className={`${styles.pokedexContainer} ${isExpanded ? styles.expanded : ''}`}>
                <div className={styles.content}>
                    { pokemonData ? (
                        // Detailed Pokemon view
                        <div className={styles.detailedView}>
                            <LeftPanel
                                pokemonId={selectedPokemon || 1}
                                isOwned={isPokemonOwned((selectedPokemon || 1) - 1)}
                                isSeen={isPokemonSeen((selectedPokemon || 1) - 1)}
                                pokemonData={pokemonData}
                                description={description}
                                buildSpritePath={buildSpritePath}
                                spriteState={spriteState}
                                toggleGender={toggleGender}
                                toggleShiny={toggleShiny}
                                toggleFront={toggleFront}
                            />

                            <Divider />

                            <RightPanel
                                pokemonIds={pokemonList}
                                isPokemonOwned={isPokemonOwned}
                                isPokemonSeen={isPokemonSeen}
                                onSelect={handlePokemonSelect}
                                isExpanded={isExpanded}
                                setIsExpanded={setIsExpanded}
                            />
                        </div>
                    ) : (
                        <div className={styles.loading}>Loading Pokédex...</div>
                    )}
                </div>
            </div>
            ) : (
            <div className={`${styles.pokedexContainer} ${isExpanded ? styles.expanded : ''}`}>
                {/* Header - always visible */}
                <div className={styles.header}>
                    <div className={styles.title}>
                        <h3>Pokédex</h3>
                        <div className={styles.stats}>
                            <span className={styles.stat}>{stats.owned}/{stats.total}</span>
                            <span className={styles.completion}>( {stats.completion}% )</span>
                        </div>
                    </div>
                    <PokedexButton className={styles.toggleButton} onClick={() => setIsExpanded(!isExpanded)} />
                </div>
            </div>
            )}
        </>
    );
}