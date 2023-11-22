import React, { useState } from "react";
import PartySlot from "./PartySlot";
import '../../styles/pokemon.css';
import { useMBCRamWatcher } from "../../utils/MBCRamWatcher";
import { parseParty } from "../../utils/pokemon/parse";
import PokemonDetailsModal from "../modals/pokemon/DetailsModal";

function ActiveParty({ MBCRam, onPauseResume, intervalPaused }) {
    const [partyData, setPartyData] = useState([]);
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useMBCRamWatcher(MBCRam, '0x2F2C', '0x194', (array) => {
        setPartyData(parseParty(array).pokemonList);
    });

    const handlePokemonClick = (pokemon) => {
        console.log(pokemon);
        setSelectedPokemon(pokemon);
        setIsModalOpen(true);
        if (!intervalPaused) onPauseResume();
    };

    const handlePokemonModalClose = () => {
        if (intervalPaused) onPauseResume();
        setIsModalOpen(false);
    }

    return (
        <div className="active-party">
            {partyData.map((pokemon, index) => (
                <PartySlot key={pokemon.id || index} pokemon={pokemon} onClick={handlePokemonClick} />
            ))}
            {selectedPokemon && (
                <PokemonDetailsModal 
                    isOpen={isModalOpen} 
                    onClose={handlePokemonModalClose} 
                    pokemon={selectedPokemon} 
                />
            )}
        </div>
    );
}


export default ActiveParty;