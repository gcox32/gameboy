import React, { useState } from "react";
import TownMapLocation from "./TownMapLocation";
import { locations } from "../../utils/pokemon/locations";
import LocationModal from "../modals/pokemon/LocationModal";

function TownMap(inGameMem) {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const mapSrc = 'https://assets.letmedemo.com/public/gameboy/images/pokemon/maps/rby-kanto-town-map.png';

    const openModal = (location) => {
        setSelectedLocation(location);
        setModalOpen(true);
    };
    return (
        <>
            <div className="town-map">
                <img src={`${mapSrc}`} alt="Town Map" />
                {locations.map((loc, index) => (
                    <TownMapLocation
                        key={index}
                        locData={loc}
                        onClick={() => openModal(loc)}
                    /> // Added a key prop for list elements
                ))}
            </div>
            {selectedLocation && (
                <LocationModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={selectedLocation.title}
                    img={selectedLocation.img}
                    desc={selectedLocation.desc}
                    persons={selectedLocation.persons}
                    places={selectedLocation.places}
                />
            )}
        </>
    )
}

export default TownMap;