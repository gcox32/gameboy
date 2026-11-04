import { useState, useEffect, useMemo, useCallback } from 'react';
import { SRAMArray } from '@/types';
import clsx from 'clsx';
import { useGame } from '@/contexts/GameContext';
import styles from './styles.module.css';
import Hinge from './Hinge';
import PokedexButton from './PokedexButton';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import { Pokemon as PokemonData } from '@/types/pokeapi/root';
import { useInGameMemoryWatcher } from '@/utils/MemoryWatcher';
import { getPokedexAddress } from '@/utils/pokemon/maps';

interface PokedexProps {
    inGameMemory: SRAMArray | number[];
    gbcMemory?: SRAMArray | number[];
    isOpen: boolean;
    onClosed: () => void;
}

// These match the transitions in styles.module.css
const COVER_SWING_MS = 700;
const FADE_MS = 200;

// Utility functions from the example
function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export default function Pokedex({ inGameMemory, gbcMemory, isOpen, onClosed }: PokedexProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showInterior, setShowInterior] = useState(false);
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

    // Fade out, then let the parent remove it
    useEffect(() => {
        if (isOpen) return;
        const timer = setTimeout(onClosed, FADE_MS);
        return () => clearTimeout(timer);
    }, [isOpen, onClosed]);

    // The interior only exists while open, so remove it once the cover has shut
    useEffect(() => {
        if (isExpanded) return;
        const timer = setTimeout(() => setShowInterior(false), COVER_SWING_MS);
        return () => clearTimeout(timer);
    }, [isExpanded]);

    // wPokedexOwned (19 bytes) is immediately followed by wPokedexSeen (19 bytes).
    // The address varies by ROM: Red and Blue use 0xD2F7, Yellow uses 0xD2F6.
    const { rom } = useGame();
    const pokedexAddress = getPokedexAddress(rom);

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
        pokedexAddress === null ? undefined : `0x${pokedexAddress.toString(16)}`,
        '0x0',
        '0x26', // owned (19) + seen (19) = 38 bytes
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
        if (pokemonId === 152) {pokemonId = 232}; // translate for one-off Donphan
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
        <div className={clsx(styles.device, isExpanded && styles.deviceOpen, !isOpen && styles.hiding)}>
            {/* The fixed half. The closed cover rests on top of it */}
            <div className={clsx(styles.half, styles.halfRight)}>
                <div className={styles.halfContent}>
                    {showInterior && (
                        <RightPanel
                            pokemonIds={pokemonList}
                            isPokemonOwned={isOwned}
                            isPokemonSeen={isSeen}
                            onSelect={handlePokemonSelect}
                            isProcessing={loading}
                            onClose={handleClose}
                        />
                    )}
                </div>
            </div>

            {/* The cover swings on the spine: its inside is the left half, its outside is the closed card */}
            <div className={clsx(styles.cover, isExpanded && styles.coverOpen)}>
                <div className={clsx(styles.half, styles.halfLeft, styles.coverInside)}>
                    <div className={styles.halfContent}>
                        {showInterior && (
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
                        )}
                    </div>
                </div>
                <div className={styles.coverOutside}>
                    <div className={styles.closedCard}>
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
                                setShowInterior(true);
                                setIsExpanded(true);
                                setUseDefault(true);
                            }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.spine}>
                <Hinge />
            </div>
        </div>
    );
}