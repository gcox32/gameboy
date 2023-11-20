import React from "react";

function PartySlot({ pokemon }) {
    return (
        <div className="party-slot">
            <img src={ `https://assets.letmedemo.com/public/gameboy/images/pokemon/gifs/${pokemon.pokedexNo}.gif` } alt="" />
        </div>
    );
};

export default PartySlot;