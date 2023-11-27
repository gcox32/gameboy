import React, { useState, useEffect, useRef } from "react";
import PartySlot from "./PartySlot";
import '../../styles/pokemon.css';
import { useInGameMemoryWatcher } from "../../utils/MemoryWatcher";
import { parseParty } from "../../utils/pokemon/parse";
import PokemonDetailsModal from "../modals/pokemon/DetailsModal";

function ActiveParty({ inGameMemory, onPauseResume, intervalPaused }) {
    const partyArray = useRef([])
    const [partyData, setPartyData] = useState([]);
    const [selectedPokemonIndex, setSelectedPokemonIndex] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useInGameMemoryWatcher(inGameMemory, '0xD162', '0x00', '0x194', (array) => {
        if (JSON.stringify(partyArray.current) !== JSON.stringify(array)) {
            setPartyData(parseParty(array).pokemonList);
            partyArray.current = array;
            console.log(array);
        }
    })

    const handlePokemonClick = (index) => {
        setSelectedPokemonIndex(index);
        setIsModalOpen(true);
        if (!intervalPaused) onPauseResume();
    };

    const handlePokemonModalClose = () => {
        if (intervalPaused) onPauseResume();
        setIsModalOpen(false);
    };

    const cyclePokemon = (direction) => {
        if (partyData.length > 0) {
            let newIndex = selectedPokemonIndex + direction;
            if (newIndex < 0) newIndex = partyData.length - 1;
            else if (newIndex >= partyData.length) newIndex = 0;
            setSelectedPokemonIndex(newIndex);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
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
        <div className="active-party">
            {partyData.map((pokemon, index) => (
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