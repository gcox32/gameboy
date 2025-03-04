import React, { useState, useEffect, useRef } from "react";
import PartySlot from "./PartySlot";
import { useInGameMemoryWatcher } from "@/utils/MemoryWatcher";
import { parseParty } from "@/utils/pokemon/parse";
import PokemonDetailsModal from "@/components/modals/pokemon/DetailsModal";
import styles from "./styles.module.css";
import { Pokemon, ActivePartyProps } from "./types";

function ActiveParty({ inGameMemory, onPauseResume, intervalPaused }: ActivePartyProps) {
    const partyArray = useRef([])
    const [partyData, setPartyData] = useState<Pokemon[]>([]);
    const [selectedPokemonIndex, setSelectedPokemonIndex] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useInGameMemoryWatcher(inGameMemory, '0xD162', '0x00', '0x195', (array: any[]) => { // start is 0xD163 in Blue but 0xD162 in True Blue
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
    })

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
            {partyData.map((pokemon: Pokemon, index: number) => (
                <PartySlot key={pokemon.id || index} pokemon={pokemon} onClick={() => handlePokemonClick(index)} />
            ))}
            {selectedPokemonIndex !== null && (
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