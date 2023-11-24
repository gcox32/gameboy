import React, { useState, useEffect } from "react";
import PartySlot from "./PartySlot";
import '../../styles/pokemon.css';
import { useMBCRamWatcher } from "../../utils/MBCRamWatcher";
import { parseParty } from "../../utils/pokemon/parse";
import PokemonDetailsModal from "../modals/pokemon/DetailsModal";

function ActiveParty({ MBCRam, onPauseResume, intervalPaused }) {
    const [partyData, setPartyData] = useState([]);
    const [selectedPokemonIndex, setSelectedPokemonIndex] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useMBCRamWatcher(MBCRam, '0x2F2C', '0x194', (array) => {
        setPartyData(parseParty(array).pokemonList);
    });

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
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isModalOpen, selectedPokemonIndex, partyData.length]);

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