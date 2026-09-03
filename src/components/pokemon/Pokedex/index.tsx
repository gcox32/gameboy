import { useState, useEffect, useMemo, useCallback } from 'react';
import { SRAMArray, GameModel, MemoryWatcherConfig } from '@/types';
import styles from './styles.module.css';
import Hinge from './Hinge';
import PokedexButton from './PokedexButton';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import { Pokemon as PokemonData } from '@/types/pokeapi/root';
import { parseMetadata, useInGameMemoryWatcher } from '@/utils/MemoryWatcher';

interface PokedexProps {
    inGameMemory: SRAMArray | number[];
    gbcMemory?: SRAMArray | number[];
    activeROM: GameModel | null;
}

// Utility functions from the example
function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export default function Pokedex({ inGameMemory, gbcMemory, activeROM }: PokedexProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedPokemon, setSelectedPokemon] = useState<number | null>(null);
    const [pokemonData, setPokemonData] = useState<PokemonData | null>(null);
    const [description, setDescription] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [useDefault, setUseDefault] = useState(false);
    const [loadingPokedex, setLoadingPokedex] = useState(true);
    const [ownedIds, setOwnedIds] = useState<Set<number>>(new Set());
    const [seenIds, setSeenIds] = useState<Set<number>>(new Set());
    const [spriteState, setSpriteState] = useState({
        front: true,
        shiny: false,
        female: false
    });

    // Read the Pokédex bytes from a fixed WRAM address (via ROM metadata, GBC-aware).
    // Gen 1: wPokedexOwned 0xD2F7 (19 bytes) is immediately followed by wPokedexSeen 0xD30A (19 bytes).
    const [watcherConfig, setWatcherConfig] = useState<MemoryWatcherConfig>({});
    useEffect(() => {
        if (!activeROM) return;
        const config = parseMetadata(activeROM, 'pokedex', {
            baseAddress: '0xD2F7',
            offset: '0x00',
            size: '0x26', // owned (19) + seen (19) = 38 bytes
        });
        setWatcherConfig(config);
    }, [activeROM]);

    const handlePokedexBytes = useCallback((slice: number[]) => {
        if (!slice || slice.length < 0x26) return;
        setLoadingPokedex(false);

        const ownedBytes = slice.slice(0, 19);
        const seenBytes = slice.slice(19, 38);
        const nextOwned = new Set<number>();
        const nextSeen = new Set<number>();
        for (let speciesId = 0; speciesId < 151; speciesId++) {
            const byteIndex = Math.floor(speciesId / 8);
            const bitIndex = speciesId % 8;
            const ownedInMemory = ((ownedBytes[byteIndex] >> bitIndex) & 1) === 1;
            const seenInMemory = ((seenBytes[byteIndex] >> bitIndex) & 1) === 1;
            if (ownedInMemory) nextOwned.add(speciesId + 1);
            if (seenInMemory) nextSeen.add(speciesId + 1);
        }

        // Only update state if the data has actually changed
        setOwnedIds(prevOwned => {
            if (prevOwned.size !== nextOwned.size) return nextOwned;
            for (const id of nextOwned) {
                if (!prevOwned.has(id)) return nextOwned;
            }
            for (const id of prevOwned) {
                if (!nextOwned.has(id)) return nextOwned;
            }
            return prevOwned; // No change, return same reference
        });

        setSeenIds(prevSeen => {
            if (prevSeen.size !== nextSeen.size) return nextSeen;
            for (const id of nextSeen) {
                if (!prevSeen.has(id)) return nextSeen;
            }
            for (const id of prevSeen) {
                if (!nextSeen.has(id)) return nextSeen;
            }
            return prevSeen; // No change, return same reference
        });
    }, []);

    useInGameMemoryWatcher(
        inGameMemory,
        watcherConfig?.baseAddress,
        watcherConfig?.offset,
        watcherConfig?.size,
        handlePokedexBytes,
        1000,
        gbcMemory
    );

    // Calculate statistics
    const stats = useMemo(() => {
        const owned = ownedIds.size;
        const seen = seenIds.size;
        const completion = Math.round((owned / 151) * 100);
        return { owned, seen, total: 151, completion };
    }, [ownedIds, seenIds]);

    const isOwned = useCallback((speciesZeroIndexed: number) => ownedIds.has(speciesZeroIndexed + 1), [ownedIds]);
    const isSeen = useCallback((speciesZeroIndexed: number) => seenIds.has(speciesZeroIndexed + 1), [seenIds]);

    // Generate Pokemon list (just numbers for now)
    const pokemonList = useMemo(() => {
        return Array.from({ length: 151 }, (_, i) => i + 1);
    }, []);

    // Load Pokemon data via internal API route
    const loadPokemonData = useCallback(async (pokemonId: number) => {

        // Start the API calls and minimum processing time in parallel
        const apiData = await (async () => {
            try {
                const response = await fetch(`/api/pokeapi/pokemon/${pokemonId}`, { cache: 'force-cache' });
                const { pokemon, species } = await response.json();

                // Set description from species
                const englishEntries = (species?.flavor_text_entries || []).filter((e: any) => e.language.name === "en");
                if (englishEntries.length > 0) {
                    setDescription(pickRandom(englishEntries.map((e: any) => e.flavor_text)));
                }

                return pokemon;
            } catch (error) {
                console.error('Error loading Pokemon data:', error);
                throw error;
            }
        })();

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
    const spritePath = useMemo((): string => {
        if (!pokemonData) return '/images/missingNo.png';
        const dir = spriteState.front ? "front" : "back";
        const gender = spriteState.female ? "_female" : "";
        const shiny = spriteState.shiny ? "_shiny" : "_default";
        const key = dir + shiny + gender;
        const spriteUrl = pokemonData.sprites[key as keyof typeof pokemonData.sprites];
        return (typeof spriteUrl === 'string' ? spriteUrl : pokemonData.sprites.front_default) || '/images/missingNo.png';
    }, [pokemonData, spriteState.front, spriteState.shiny, spriteState.female]);

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
                                isOwned={selectedPokemon ? isOwned(selectedPokemon - 1) : false}
                                isSeen={selectedPokemon ? isSeen(selectedPokemon - 1) : false}
                                pokemonData={pokemonData}
                                description={description}
                                spritePath={spritePath}
                                spriteState={spriteState}
                                toggleGender={toggleGender}
                                toggleShiny={toggleShiny}
                                toggleFront={toggleFront}
                                useDefault={useDefault}
                            />

                            <Hinge />

                            <RightPanel
                                pokemonIds={pokemonList}
                                isPokemonOwned={isOwned}
                                isPokemonSeen={isSeen}
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
                            <h3>pokédex</h3>
                            <div className={styles.stats}>
                                <span className={styles.stat}>{loadingPokedex ? '--' : `${stats.seen} seen`}</span>
                            </div>
                            <div className={styles.stats}>
                                <span className={styles.stat}>{loadingPokedex ? '--' : `${stats.owned} caught`}</span>
                            </div>
                        </div>
                        <PokedexButton onClick={() => {
                            if (loadingPokedex) return;
                            setIsExpanded(!isExpanded);
                            setUseDefault(true);
                        }} />
                    </div>
                </div>
            )}
        </>
    );
}