import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSRAMData } from '@/hooks/useSRAMData';
import { SRAMArray, GameModel } from '@/types';
import styles from './styles.module.css';
import { FaEye, FaEyeSlash, FaCheck, FaVenus, FaUndo } from 'react-icons/fa';
import Divider from './Divider';
import PokedexButton from './PokedexButton';
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
            if (data.moves.length > 0) {
                loadMoveData(data.moves[0].move.url);
            }
        } catch (error) {
            console.error('Error loading Pokemon data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load move data
    const loadMoveData = useCallback(async (moveUrl: string) => {
        try {
            const response = await fetch(moveUrl);
            const data = await response.json();
            setCurrentMove(data);
        } catch (error) {
            console.error('Error loading move data:', error);
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

    // Move navigation
    const nextMove = useCallback(() => {
        if (moves.length > 0) {
            const nextIndex = Math.min(currentMoveIndex + 1, moves.length - 1);
            setCurrentMoveIndex(nextIndex);
            loadMoveData(moves[nextIndex].move.url);
        }
    }, [moves, currentMoveIndex, loadMoveData]);

    const prevMove = useCallback(() => {
        if (moves.length > 0) {
            const prevIndex = Math.max(currentMoveIndex - 1, 0);
            setCurrentMoveIndex(prevIndex);
            loadMoveData(moves[prevIndex].move.url);
        }
    }, [moves, currentMoveIndex, loadMoveData]);

    // Build sprite image path
    const buildSpritePath = useCallback(() => {
        if (!pokemonData) return '';
        const dir = spriteState.front ? "front" : "back";
        const gender = spriteState.female ? "_female" : "";
        const shiny = spriteState.shiny ? "_shiny" : "_default";
        const key = dir + shiny + gender;
        return pokemonData.sprites[key as keyof typeof pokemonData.sprites] || pokemonData.sprites.front_default;
    }, [pokemonData, spriteState]);

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
                    {selectedPokemon && pokemonData ? (
                        // Detailed Pokemon view
                        <div className={styles.detailedView}>
                            <PokedexButton className={styles.toggleButton} onClick={() => setIsExpanded(!isExpanded)} />
                            <div className={styles.leftPanel}>
                                <div className={styles.pokemonName}>
                                    {pokemonData.name}
                                    <span className={styles.nameNo}>no. {pokemonData.id}</span>
                                </div>
                                <div className={styles.pokemonSprite}>
                                    <Image src={buildSpritePath()} alt="pokemon" className={styles.spriteImage} width={300} height={300} />
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
                                    {description}
                                </div>
                            </div>

                            <Divider />

                            <div className={styles.rightPanel}>
                                <div className={styles.panelRow}>
                                    <div className={styles.stats}>
                                        {pokemonData.stats.map(stat => (
                                            <div key={stat.stat.name} className={styles.statLine}>
                                                {padStats(stat.stat.name, stat.base_stat, ".", 18)}
                                            </div>
                                        ))}
                                    </div>
                                    <div className={styles.typeList}>
                                        <div className={styles.panelHeader}>Types</div>
                                        <div className={styles.typeBox}>
                                            {pokemonData.types.map(type => (
                                                <div key={type.type.name} className={`${styles.type} ${styles[type.type.name]}`}>
                                                    {type.type.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.panelRow}>
                                    <div className={styles.evolution}>
                                        {evoSprites.map((sprite, index) => (
                                            <div key={index} className={styles.evoPokemon}>
                                                <div className={styles.evoNum}>{index + 1}</div>
                                                {sprite ? (
                                                    <Image src={sprite} alt="pokemon" className={styles.evoSprite} width={120} height={120} />
                                                ) : (
                                                    <div className={styles.pokeBall}></div>
                                                )}
                                                <div className={styles.evoName}>{evoNames[index] || "No Data"}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.moveList}>
                                    {currentMove ? (
                                        <div className={styles.moveBody}>
                                            <div className={styles.moveLeft}>
                                                <div className={styles.moveName}>{currentMove.name}</div>
                                                <div className={styles.moveStat}>{padStats("Accuracy", currentMove.accuracy, ".", 16)}</div>
                                                <div className={styles.moveStat}>{padStats("Power", currentMove.power, ".", 16)}</div>
                                                <div className={styles.moveStat}>{padStats("PP", currentMove.pp, ".", 16)}</div>
                                            </div>
                                            <div className={styles.moveRight}>
                                                <div className={styles.moveType}>Type: {currentMove.type.name}</div>
                                                <div className={styles.moveLearn}>Learn: Lvl {moves[currentMoveIndex]?.version_group_details[0]?.level_learned_at || 'xx'}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={styles.moveBody}>
                                            <div className={styles.moveLeft}>
                                                <div className={styles.moveName}>xxxxx xxxxx</div>
                                                <div className={styles.moveStat}>{padStats("Accuracy", "xx", ".", 16)}</div>
                                                <div className={styles.moveStat}>{padStats("Power", "xx", ".", 16)}</div>
                                                <div className={styles.moveStat}>{padStats("PP", "xx", ".", 16)}</div>
                                            </div>
                                            <div className={styles.moveRight}>
                                                <div className={styles.moveType}>Type: xxxxx</div>
                                                <div className={styles.moveLearn}>Learn: Lvl xx</div>
                                            </div>
                                        </div>
                                    )}
                                    <div className={styles.moveControls}>
                                        <PokedexButton onClick={prevMove}>
                                            <i className="fas fa-caret-up" />
                                        </PokedexButton>
                                        <PokedexButton onClick={nextMove}>
                                            <i className="fas fa-caret-down" />
                                        </PokedexButton>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Pokemon list view
                        <>
                            {/* Controls */}
                            <div className={styles.controls}>
                                <div className={styles.searchContainer}>
                                    <input
                                        type="text"
                                        placeholder="Search by number..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={styles.searchInput}
                                    />
                                </div>

                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value as any)}
                                    className={styles.filterSelect}
                                >
                                    <option value="all">All</option>
                                    <option value="owned">Owned</option>
                                    <option value="seen">Seen</option>
                                    <option value="unseen">Not Seen</option>
                                </select>
                            </div>

                            {/* Pokemon Grid */}
                            <div className={styles.pokemonGrid}>
                                {filteredPokemon.map((pokemonId) => {
                                    const owned = isPokemonOwned(pokemonId - 1);
                                    const seen = isPokemonSeen(pokemonId - 1);

                                    return (
                                        <div
                                            key={pokemonId}
                                            className={`${styles.pokemonCard} ${owned ? styles.owned : seen ? styles.seen : styles.unseen}`}
                                            onClick={() => handlePokemonSelect(pokemonId)}
                                        >
                                            <div className={styles.pokemonNumber}>
                                                #{pokemonId.toString().padStart(3, '0')}
                                            </div>
                                            <div className={styles.pokemonStatus}>
                                                {owned ? (
                                                    <FaCheck className={styles.statusIcon} title="Owned" />
                                                ) : seen ? (
                                                    <FaEye className={styles.statusIcon} title="Seen" />
                                                ) : (
                                                    <FaEyeSlash className={styles.statusIcon} title="Not Seen" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
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