import React from "react";
import BaseModal from "../BaseModal";
import Image from "next/image";

function LocationModal({ isOpen, onClose, title, slogan, img, desc, persons, places }) {
    if (!isOpen) return null;
    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className={"location-modal"}>
            {img && (
                <Image
                    src={img}
                    className="map-loc-hero"
                    alt={title}
                    layout="responsive"
                    width={800}  // Specify appropriate width
                    height={600} // Specify appropriate height
                />
            )}
            <div className="map-loc-details">
                <h2 className="map-loc-title">{title}</h2>
                {slogan && <h3 className="map-loc-subtitle">{slogan}</h3>}
                <hr />
                <p>{desc}</p>
                <hr />
                {persons.length > 0 && <p>Persons of Interest: {persons.join(', ')}</p>}
                {places.length > 0 && <p>Places of Interest: {places.join(', ')}</p>}
            </div>
        </BaseModal>
    );
}

export default LocationModal