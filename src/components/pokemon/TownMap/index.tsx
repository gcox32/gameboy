import React, { useState } from "react";
import TownMapLocation from "./TownMapLocation";
import { locations } from "@/utils/pokemon/locations";
import LocationModal from "@/components/modals/pokemon/LocationModal";
import styles from "./styles.module.css";

interface Location {
    title: string;
    slogan: string;
    img: string;
    desc: string;
    persons: string[];
    places: string[];
}

function TownMap() {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const mapSrc = 'https://assets.letmedemo.com/public/gameboy/images/pokemon/maps/rby-kanto-town-map.png';

    const openModal = (location: any) => {
        setSelectedLocation(location);
        setModalOpen(true);
    };
    return (
        <>
            <div className={styles.townMap}>
                <img src={`${mapSrc}`} alt="Town Map" />
                {locations.map((loc, index) => (
                    <TownMapLocation
                        key={index}
                        locData={loc}
                        onClick={() => openModal(loc)}
                    />
                ))}
            </div>
            {selectedLocation && (
                <LocationModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={selectedLocation.title}
                    slogan={selectedLocation.slogan}
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