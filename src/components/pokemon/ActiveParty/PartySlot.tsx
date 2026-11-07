import { CSSProperties } from "react";
import Image from "next/image";
import clsx from "clsx";
import styles from "./styles.module.css";
import { PokemonDetails } from "@/types/pokemon";
import { usePokemonSprites } from "@/hooks/usePokemonSprites";

export interface PartySlotProps {
    pokemon: PokemonDetails;
    index: number;
    isBallOpen: boolean;
    onClick: (pokemon: PokemonDetails) => void;
}

function PartySlot({ pokemon, index, isBallOpen, onClick }: PartySlotProps) {
    const { byDexNo, spriteStyle } = usePokemonSprites();
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
                    src={byDexNo(pokemon.pokedexNo)}
                    alt=""
                    fill
                    sizes="110px"
                    className={styles.spriteImage}
                    style={spriteStyle}
                    unoptimized
                />
            </span>
            <span className={styles.shellBottom} />
            <span className={styles.shellTop} />
        </button>
    );
}

export default PartySlot;
