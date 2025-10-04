import React, { useState, useEffect, useMemo } from 'react';
import { useSRAMData } from '@/hooks/useSRAMData';
import { SRAMArray, GameModel } from '@/types';
import styles from './styles.module.css';
import { FaEye, FaEyeSlash, FaCheck, FaTimes, FaSearch } from 'react-icons/fa';

interface PokedexProps {
    inGameMemory: SRAMArray | number[];
    activeROM: GameModel;
}

export default function Pokedex({ inGameMemory, activeROM }: PokedexProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'owned' | 'seen' | 'unseen'>('all');
    const [isExpanded, setIsExpanded] = useState(false);

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
        <div className={`${styles.pokedexContainer} ${isExpanded ? styles.expanded : ''}`}>
            {/* Header - always visible */}
            <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
                <div className={styles.title}>
                    <h3>Pokédex</h3>
                    <div className={styles.stats}>
                        <span className={styles.stat}>{stats.owned}/{stats.total}</span>
                        <span className={styles.completion}>{stats.completion}%</span>
                    </div>
                </div>
                <button className={styles.toggleButton}>
                    {isExpanded ? <FaTimes /> : <FaSearch />}
                </button>
            </div>

            {/* Expanded content */}
            {isExpanded && (
                <div className={styles.content}>
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
                </div>
            )}
        </div>
    );
}