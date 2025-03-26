import React from "react";
import { assetsEndpoint } from "@/../config";
import Image from "next/image";
import styles from "./styles.module.css";
import { PokemonDetails } from "@/types/pokemon";

export interface PartySlotProps {
    pokemon: PokemonDetails;
    onClick: (pokemon: PokemonDetails) => void;
    useStadiumSprites?: boolean;
}

function PartySlot({ pokemon, onClick, useStadiumSprites }: PartySlotProps) {
    const assetsEndpointPublic = `${assetsEndpoint}public/`;
    const pokemonGifEndpoint = `${assetsEndpointPublic}gameboy/images/pokemon/gifs/`;
    const pokemonStadiumGifEndpoint = `${assetsEndpointPublic}gameboy/images/pokemon/stadium/gifs/`;

    return (
        <div className={styles.partySlot} onClick={() => onClick(pokemon)}>
            <div>
                <Image 
                    src={`${useStadiumSprites ? pokemonStadiumGifEndpoint : pokemonGifEndpoint}${pokemon.pokedexNo}.gif`} 
                    alt={pokemon.speciesName ? pokemon.speciesName : "species name"} 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{borderRadius:"50%", objectFit: "contain"}}
                    unoptimized
                />
            </div>
        </div>
    );
};

export default PartySlot;