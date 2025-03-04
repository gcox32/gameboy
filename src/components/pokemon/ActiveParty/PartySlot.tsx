import React from "react";
import { pokemonGifEndpoint } from "@/../config";
import Image from "next/image";
import styles from "./styles.module.css";
import { PartySlotProps } from "./types";

function PartySlot({ pokemon, onClick }: PartySlotProps) {
    return (
        <div className={styles.partySlot} onClick={() => onClick(pokemon)}>
            <div>
                <Image 
                    src={ `${pokemonGifEndpoint}${pokemon.pokedexNo}.gif` } 
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