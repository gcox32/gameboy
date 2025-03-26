import React, { useState, useEffect, useRef } from "react";
import PartySlot from "./PartySlot";
import { useInGameMemoryWatcher, parseMetadata } from "@/utils/MemoryWatcher";
import { parseParty } from "@/utils/pokemon/parse";
import PokemonDetailsModal from "@/components/pokemon/ActiveParty/DetailsModal";
import styles from "./styles.module.css";
import { ActivePartyProps, PokemonDetails } from "@/types/pokemon";
import { MemoryWatcherConfig } from "@/types/schema";

function ActiveParty({ inGameMemory, onPauseResume, intervalPaused, activeROM }: ActivePartyProps) {
    const partyArray = useRef([])
    const [partyData, setPartyData] = useState<PokemonDetails[]>([]);
    const [selectedPokemonIndex, setSelectedPokemonIndex] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [watcherConfig, setWatcherConfig] = useState<MemoryWatcherConfig>({});

    useEffect(() => {
        if (!activeROM) return;
        const watcherConfig = parseMetadata(activeROM, 'activeParty', {
            baseAddress: '0xD163', // default fallback for Pokemon games
            offset: '0x00',
            size: '0x195'
        });
        setWatcherConfig(watcherConfig);
    }, [activeROM]);

    useInGameMemoryWatcher(
        inGameMemory,
        watcherConfig?.baseAddress,
        watcherConfig?.offset,
        watcherConfig?.size,
        (array: any[]) => {
            if (JSON.stringify(partyArray.current) !== JSON.stringify(array)) {
                try {
                    const parsedParty = parseParty(array);
                    setPartyData(parsedParty.pokemonList);
                    partyArray.current = array as never[];
                } catch {
                    console.log('Full party not interpretable.')
                    setPartyData([])
                    partyArray.current = []
                    handlePokemonModalClose();
                }
            }
        }
    );

    const handlePokemonClick = (index: number) => {
        setSelectedPokemonIndex(index);
        setIsModalOpen(true);
        if (!intervalPaused) onPauseResume();
    };

    const handlePokemonModalClose = () => {
        if (intervalPaused) onPauseResume();
        setIsModalOpen(false);
    };

    const cyclePokemon = (direction: number) => {
        if (partyData.length > 0) {
            let newIndex = selectedPokemonIndex as number + direction;
            if (newIndex < 0) newIndex = partyData.length - 1;
            else if (newIndex >= partyData.length) newIndex = 0;
            setSelectedPokemonIndex(newIndex);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isModalOpen) {
                if (e.key === 'ArrowLeft') {
                    cyclePokemon(-1);
                } else if (e.key === 'ArrowRight') {
                    cyclePokemon(1);
                } else if (e.key === 'Escape' && isModalOpen) {
                    handlePokemonModalClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    });

    return (
        <div className={styles.activeParty}>
            {partyData.map((pokemon: PokemonDetails, index: number) => (
                <PartySlot key={pokemon.pokedexNo || index} pokemon={pokemon} onClick={() => handlePokemonClick(index)} />
            ))}
            {(selectedPokemonIndex !== null && partyData.length) && (
                <PokemonDetailsModal
                    isOpen={isModalOpen}
                    onClose={handlePokemonModalClose}
                    pokemon={partyData[selectedPokemonIndex]}
                />
            )}
        </div>
    );
}


export default ActiveParty;