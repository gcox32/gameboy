import React from "react";
import BaseModal from "@/components/modals/BaseModal";
import Image from "next/image";
import styles from "./styles.module.css";

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    slogan: string;
    img: string;
    desc: string;
    persons: string[];
    places: string[];
}

function LocationModal({ isOpen, onClose, title, slogan, img, desc, persons, places }: LocationModalProps) {
    if (!isOpen) return null;
    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className={`${styles.modalContent} ${styles.locationModal}`}>
            {img && (
                <Image
                    src={img}
                    className={styles.mapLocHero}
                    alt={title}
                    layout="responsive"
                    width={800}  // Specify appropriate width
                    height={600} // Specify appropriate height
                />
            )}
            <div className={styles.mapLocDetails}>
                <h2 className={styles.mapLocTitle}>{title}</h2>
                {slogan && <h3 className={styles.mapLocSubtitle}>{slogan}</h3>}
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