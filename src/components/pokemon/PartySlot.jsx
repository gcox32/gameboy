import React from "react";

function PartySlot({ pokemon, onClick }) {
    return (
        <div className="party-slot" onClick={() => onClick(pokemon)}>
            <img src={ `https://assets.letmedemo.com/public/gameboy/images/pokemon/gifs/${pokemon.pokedexNo}.gif` } alt="" />
        </div>
    );
};

export default PartySlot;