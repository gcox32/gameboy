import React, { useState } from "react";
import BaseModal from "@/components/modals/BaseModal";
import RadarChart from "./RadarChart";
import Image from "next/image";
import styles from "./styles.module.css";
import { sugimoriRb, sugimoriRg, sugimoriFrlg } from "@/../config";
import { Move, PokemonDetails } from "@/types/pokemon";

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
    const structure = pokemon.structure;

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className={styles.modalContent}>
            <div className={styles.pokemonDetailsRow}>
                <div className={styles.pokemonDetailsSection + " " + styles.top}>
                    <h2>{pokemon.nickname || pokemon.speciesName}</h2>
                    <p>Lv.{pokemon.structure.level}</p>
                    <p>#{pokemon.pokedexNo.toString().padStart(3, '0')}</p>
                    <div>
                        <span className={`${styles.typeTag} ${styles[structure.type1.toLowerCase() + 'Type']}`}>
                            {structure.type1}
                        </span>
                        {structure.type2 !== structure.type1 && (
                            <span className={`${styles.typeTag} ${styles[structure.type2.toLowerCase() + 'Type']}`}>
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

                <div className={styles.pokemonDetailsSection + " " + styles.top}>
                    <h4>Moveset</h4>
                    {structure.moves.map((move: Move, index: number) => (
                        move.id !== 0 && (
                            <div key={index} className={styles.pokemonMove}>
                                <p>{move.id} (PP: {move.pp})</p>
                            </div>
                        )
                    ))}
                </div>
            </div>

            <div className={styles.pokemonDetailsRow}>
                {/* Stats Section */}
                <div
                    className={`${styles.pokemonDetailsSection} ${isStatsFlipped ? styles.back : ''}`}
                    onClick={() => setIsStatsFlipped(!isStatsFlipped)}
                >
                    {isStatsFlipped ? (
                        <RadarChart stats={structure.levelStats} chartTitle="Level Stats" />
                    ) : (
                        <div>
                            <h3>Stats</h3>
                            <div className={styles.statValue}>
                                <span style={{ marginRight: "1em" }}>HP:</span>
                                {renderStatBar(structure.levelStats.maxHP, 255, 'stat')}
                                <span>{structure.levelStats.maxHP}</span>
                            </div>
                            <div className={styles.statValue}>
                                <span>ATK:</span>
                                {renderStatBar(structure.levelStats.attack, 255, 'stat')}
                                <span>{structure.levelStats.attack}</span>
                            </div>
                            <div className={styles.statValue}>
                                <span>DEF:</span>
                                {renderStatBar(structure.levelStats.defense, 255, 'stat')}
                                <span>{structure.levelStats.defense}</span>
                            </div>
                            <div className={styles.statValue}>
                                <span>SPE:</span>
                                {renderStatBar(structure.levelStats.speed, 255, 'stat')}
                                <span>{structure.levelStats.speed}</span>
                            </div>
                            <div className={styles.statValue}>
                                <span>SPC:</span>
                                {renderStatBar(structure.levelStats.special, 255, 'stat')}
                                <span>{structure.levelStats.special}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* EVs */}
                <div
                    className={`${styles.pokemonDetailsSection} ${isEVsFlipped ? styles.back : ''}`}
                    onClick={() => setIsEVsFlipped(!isEVsFlipped)}
                >
                    {isEVsFlipped ? (
                        <RadarChart stats={structure.EVs} chartTitle="EVs" />
                    ) : (
                        <div>
                            <h3>Effort Values</h3>
                            <div className={styles.statValue}>
                                <span>HP:</span>
                                {renderStatBar(structure.EVs.hp, 65535, 'ev')}
                                <span>{structure.EVs.hp}</span>
                            </div>
                            <div className={styles.statValue}>
                                <span>ATK:</span>
                                {renderStatBar(structure.EVs.attack, 65535, 'ev')}
                                <span>{structure.EVs.attack}</span>
                            </div>
                            <div className={styles.statValue}>
                                <span>DEF:</span>
                                {renderStatBar(structure.EVs.defense, 65535, 'ev')}
                                <span>{structure.EVs.defense}</span>
                            </div>
                            <div className={styles.statValue}>
                                <span>SPE:</span>
                                {renderStatBar(structure.EVs.speed, 65535, 'ev')}
                                <span>{structure.EVs.speed}</span>
                            </div>
                            <div className={styles.statValue}>
                                <span>SPC:</span>
                                {renderStatBar(structure.EVs.special, 65535, 'ev')}
                                <span>{structure.EVs.special}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* IVs */}
                <div
                    className={`${styles.pokemonDetailsSection} ${isIVsFlipped ? styles.back : ''}`}
                    onClick={() => setIsIVsFlipped(!isIVsFlipped)}
                >
                    {isIVsFlipped ? (
                        <RadarChart stats={structure.IVs} chartTitle="IVs" />
                    ) : (
                        <div>
                            <h3>Individual Values</h3>
                            <div className={styles.statValue}>
                                <span>HP:</span>
                                {renderStatBar(structure.IVs.hp, 15, 'iv')}
                                <span>{structure.IVs.hp}</span>
                            </div>
                            <div className={styles.statValue}>
                                <span>ATK:</span>
                                {renderStatBar(structure.IVs.attack, 15, 'iv')}
                                <span>{structure.IVs.attack}</span>
                            </div>
                            <div className={styles.statValue}>
                                <span>DEF:</span>
                                {renderStatBar(structure.IVs.defense, 15, 'iv')}
                                <span>{structure.IVs.defense}</span>
                            </div>
                            <div className={styles.statValue}>
                                <span>SPE:</span>
                                {renderStatBar(structure.IVs.speed, 15, 'iv')}
                                <span>{structure.IVs.speed}</span>
                            </div>
                            <div className={styles.statValue}>
                                <span>SPC:</span>
                                {renderStatBar(structure.IVs.special, 15, 'iv')}
                                <span>{structure.IVs.special}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </BaseModal>
    );
}

export default PokemonDetailsModal;