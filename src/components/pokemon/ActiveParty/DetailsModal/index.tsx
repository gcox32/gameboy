import React, { useState } from "react";
import BaseModal from "@/components/modals/BaseModal";
import RadarChart from "./RadarChart";
import Image from "next/image";
import styles from "./styles.module.css";
import { sugimoriRb, sugimoriRg, sugimoriFrlg } from "@/../config";
import { PokemonDetails } from "@/types/pokemon";
import CurrentStats from "./Stats/CurrentStats";
import EffortValues from "./Stats/EffortValues";
import IndividualValues from "./Stats/IndividuaValues";
import Moveset from "./Moveset";

interface PokemonDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    pokemon: PokemonDetails;
}

function PokemonDetailsModal({ isOpen, onClose, pokemon }: PokemonDetailsModalProps) {
    const [isStatsFlipped, setIsStatsFlipped] = useState(false);
    const [isEVsFlipped, setIsEVsFlipped] = useState(false);
    const [isIVsFlipped, setIsIVsFlipped] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState(sugimoriRb);

    const imageUrls = [sugimoriRb, sugimoriRg, sugimoriFrlg];

    const handleImageClick = () => {
        const currentIndex = imageUrls.indexOf(currentImageUrl);
        const nextIndex = (currentIndex + 1) % imageUrls.length;
        setCurrentImageUrl(imageUrls[nextIndex]);
    };

    const renderStatBar = (value: number, max: number = 255, type: 'stat' | 'ev' | 'iv' = 'stat') => {
        const percentage = (value / max) * 100;
        return (
            <div className={styles.statBar}>
                <div 
                    className={`${styles.statBarFill} ${styles[type]}`}
                    style={{ width: `${percentage}%` }} 
                />
            </div>
        );
    };

    if (!isOpen) return null;

    if (!pokemon) return null;
    
    const structure = pokemon.structure;

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className={styles.modalContent} lightCloseButton>
            <div className={styles.pokemonDetailsRow}>
                <div className={styles.pokemonDetailsSection + " " + styles.top}>
                    <h2>{pokemon.nickname || pokemon.speciesName}</h2>
                    <p>Lv.{pokemon.structure.level}</p>
                    <p>#{pokemon.pokedexNo.toString().padStart(3, '0')}</p>
                    <div>
                        <span className={`${styles.typeTag} ${styles[structure.type1?.toLowerCase() + 'Type']}`}>
                            {structure.type1}
                        </span>
                        {structure.type2 !== structure.type1 && (
                            <span className={`${styles.typeTag} ${styles[structure.type2?.toLowerCase() + 'Type']}`}>
                                {structure.type2}
                            </span>
                        )}
                    </div>
                    <p>OT: {pokemon.otName}</p>
                </div>

                <div className={styles.pokemonDetailsSection + " " + styles.centered + " " + styles.top} onClick={handleImageClick}>
                    <Image
                        src={`${currentImageUrl}${pokemon.pokedexNo}.png`}
                        style={{ cursor: "pointer", objectFit: "contain", borderRadius: "12px" }}
                        alt={pokemon.speciesName || "Pokemon"}
                        fill
                    />
                </div>

                <Moveset moves={structure.moves} />

            </div>

            <div className={styles.pokemonDetailsRow}>
                <div
                    className={`${styles.pokemonDetailsSection} ${isStatsFlipped ? styles.back : ''} ${styles.cursorPointer}`}
                    onClick={() => setIsStatsFlipped(!isStatsFlipped)}
                >
                    {isStatsFlipped ? (
                        <RadarChart stats={structure.levelStats} chartTitle="Level Stats" />
                    ) : (
                        <CurrentStats renderStatBar={renderStatBar} structure={structure} />
                    )}
                </div>
                <div
                    className={`${styles.pokemonDetailsSection} ${isEVsFlipped ? styles.back : ''} ${styles.cursorPointer}`}
                    onClick={() => setIsEVsFlipped(!isEVsFlipped)}
                >
                    {isEVsFlipped ? (
                        <RadarChart stats={structure.EVs} chartTitle="EVs" />
                    ) : (
                        <EffortValues renderStatBar={renderStatBar} structure={structure} />
                    )}
                </div>
                <div
                    className={`${styles.pokemonDetailsSection} ${isIVsFlipped ? styles.back : ''} ${styles.cursorPointer}`}
                    onClick={() => setIsIVsFlipped(!isIVsFlipped)}
                >
                    {isIVsFlipped ? (
                        <RadarChart stats={structure.IVs} chartTitle="IVs" />
                    ) : (
                        <IndividualValues renderStatBar={renderStatBar} structure={structure} />
                    )}
                </div>
            </div>
        </BaseModal>
    );
}

export default PokemonDetailsModal;