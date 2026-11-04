import { CSSProperties } from "react";
import { assetsEndpoint } from "@/../config";
import Image from "next/image";
import clsx from "clsx";
import styles from "./styles.module.css";
import { PokemonDetails } from "@/types/pokemon";

export interface PartySlotProps {
    pokemon: PokemonDetails;
    index: number;
    isBallOpen: boolean;
    onClick: (pokemon: PokemonDetails) => void;
    useStadiumSprites?: boolean;
}

const assetsEndpointPublic = `${assetsEndpoint}public/`;
const pokemonGifEndpoint = `${assetsEndpointPublic}gameboy/images/pokemon/gifs/`;
const pokemonStadiumGifEndpoint = `${assetsEndpointPublic}gameboy/images/pokemon/stadium/gifs/`;

function PartySlot({ pokemon, index, isBallOpen, onClick, useStadiumSprites }: PartySlotProps) {
    const name = pokemon.nickname || pokemon.speciesName || `No. ${pokemon.pokedexNo}`;
    const isFainted = pokemon.structure.currentHP === 0;

    return (
        <button
            type="button"
            // A fainted Pokémon stays inside its closed ball
            className={clsx(styles.ball, isBallOpen && !isFainted && styles.ballOpen, isFainted && styles.ballFainted)}
            style={{ '--slot-index': index } as CSSProperties}
            onClick={() => onClick(pokemon)}
            title={name}
            aria-label={isFainted ? `${name}, fainted` : name}
        >
            <span className={styles.sprite}>
                <Image
                    src={`${useStadiumSprites ? pokemonStadiumGifEndpoint : pokemonGifEndpoint}${pokemon.pokedexNo}.gif`}
                    alt=""
                    fill
                    sizes="110px"
                    className={clsx(styles.spriteImage, !useStadiumSprites && styles.spritePixelated)}
                    unoptimized
                />
            </span>
            <span className={styles.shellBottom} />
            <span className={styles.shellTop} />
        </button>
    );
}

export default PartySlot;
