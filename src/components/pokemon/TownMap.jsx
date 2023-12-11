import React from "react";
import TownMapLocation from "./TownMapLocation";
import { locations } from "../../utils/pokemon/locations";

function TownMap(inGameMem) {
    const mapSrc = 'https://assets.letmedemo.com/public/gameboy/images/pokemon/maps/rby-kanto-town-map.png'

    return (
        <>
            <div className="town-map">
                <img src={`${mapSrc}`} alt="Town Map" />
                {locations.map((loc, index) => (
                    <TownMapLocation key={index} locData={loc} /> // Added a key prop for list elements
                ))}
            </div>
        </>
    )
}

export default TownMap;