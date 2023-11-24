import React from "react";
import { pokemonGifEndpoint } from "../../config";

function PartySlot({ pokemon, onClick }) {
    return (
        <div className="party-slot" onClick={() => onClick(pokemon)}>
            <img src={ `${pokemonGifEndpoint}${pokemon.pokedexNo}.gif` } alt={pokemon.speciesName} />
        </div>
    );
};

export default PartySlot;