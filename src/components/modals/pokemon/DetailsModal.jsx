import React, { useState } from "react";
import BaseModal from "../BaseModal";
import RadarChart from "./RadarChart";
import { sugimoriRb, sugimoriRg, sugimoriFrlg } from "../../../../config";

function PokemonDetailsModal({ isOpen, onClose, pokemon }) {
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

    if (!isOpen) return null;
    const structure = pokemon.structure;
    return (
        <BaseModal isOpen={isOpen} onClose={onClose}>
            {/* First Row */}
            <div className="pokemon-details-row">
                {/* Section A */}
                <div className="pokemon-details-section top">
                    <h2>{pokemon.nickname || pokemon.speciesName}</h2>
                    <p>#{pokemon.pokedexNo}</p>
                    <p>{structure.type1}{structure.type2 !== structure.type1 ? `/${structure.type2}` : ""}</p>
                    <p>OT: {pokemon.otName}</p>
                </div>
                {/* Section B - Picture */}
                <div className="pokemon-details-section centered top hover-pointer" onClick={handleImageClick}>
                    <img src={`${currentImageUrl}${pokemon.pokedexNo}.png`} alt={pokemon.speciesName} className="hover-pointer"/>
                </div>
                {/* Moves */}
                <div className="pokemon-details-section top">
                    <h3>Moveset</h3>
                    {structure.moves.map((move, index) => (
                        <div key={index} className="pokemon-move">
                            {move.id !== 0 ? (<p>{move.id} (PP: {move.pp})</p>) : ''}
                        </div>
                    ))}
                </div>
            </div>

            {/* Second Row */}
            <div className="pokemon-details-row">
                {/* Level Stats */}
                <div
                    className={`pokemon-details-section ${isStatsFlipped ? 'back' : ''}`}
                    onClick={() => setIsStatsFlipped(!isStatsFlipped)}
                >
                    {
                        isStatsFlipped ?
                            <RadarChart stats={structure.levelStats} chartTitle="Level Stats" /> :
                            <div>
                                <h3>Stats</h3>
                                <p>HP: {structure.currentHP} / {structure.levelStats.maxHP}</p>
                                <p>ATK: {structure.levelStats.attack}</p>
                                <p>DEF: {structure.levelStats.defense}</p>
                                <p>SPE: {structure.levelStats.speed}</p>
                                <p>SPC: {structure.levelStats.special}</p>
                            </div>
                    }
                </div>
                {/* EVs */}
                <div
                    className={`pokemon-details-section ${isEVsFlipped ? 'back' : ''}`}
                    onClick={() => setIsEVsFlipped(!isEVsFlipped)}
                >
                    {
                        isEVsFlipped ?
                            <RadarChart stats={structure.EVs} chartTitle="EVs" /> :
                            <div>
                                <h3>EVs</h3>
                                <p>HP: {structure.EVs.hp}</p>
                                <p>ATK: {structure.EVs.attack}</p>
                                <p>DEF: {structure.EVs.defense}</p>
                                <p>SPE: {structure.EVs.speed}</p>
                                <p>SPC: {structure.EVs.special}</p>
                            </div>
                    }
                </div>
                {/* IVs */}
                <div
                    className={`pokemon-details-section ${isIVsFlipped ? 'back' : ''}`}
                    onClick={() => setIsIVsFlipped(!isIVsFlipped)}
                >
                    {
                        isIVsFlipped ?
                            <RadarChart stats={structure.IVs} chartTitle="IVs" /> :
                            <div>
                                <h3>IVs</h3>
                                <p>HP: {structure.IVs.hp}</p>
                                <p>ATK: {structure.IVs.attack}</p>
                                <p>DEF: {structure.IVs.defense}</p>
                                <p>SPE: {structure.IVs.speed}</p>
                                <p>SPC: {structure.IVs.special}</p>
                            </div>
                    }
                </div>
            </div>
        </BaseModal>
    );
}

export default PokemonDetailsModal