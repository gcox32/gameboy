import { useState } from "react";
import Image from "next/image";
import BaseModal from "@/components/modals/BaseModal";
import { Location } from "@/types/pokemon";
import { getCropPosition, townMapSrc } from "../geometry";
import styles from "./styles.module.css";

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    location: Location;
}

// Matches .mapCrop in styles.module.css
const CROP_ZOOM = 2.5;
const CROP_ASPECT_RATIO = 3;

function LocationModal({ isOpen, onClose, location }: LocationModalProps) {
    const { title, slogan, img, desc, locType, persons = [], places = [] } = location;
    const [imageFailed, setImageFailed] = useState(false);

    if (!isOpen) return null;

    const crop = getCropPosition(location, CROP_ZOOM, CROP_ASPECT_RATIO);

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className={styles.locationModal}>
            <article className={styles.page}>
                {img && !imageFailed ? (
                    <div className={styles.photo}>
                        <Image
                            src={img}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 90vw, 640px"
                            onError={() => setImageFailed(true)}
                        />
                    </div>
                ) : (
                    <div
                        className={styles.mapCrop}
                        role="img"
                        aria-label={`${title} on the town map`}
                        style={{
                            backgroundImage: `url(${townMapSrc})`,
                            backgroundPosition: `${crop.x}% ${crop.y}%`,
                        }}
                    />
                )}

                <div className={styles.details}>
                    {locType && <div className={styles.locType}>{locType}</div>}
                    <h2 className={styles.title}>{title}</h2>
                    {slogan && <p className={styles.slogan}>{slogan}</p>}
                    {desc && <p className={styles.description}>{desc}</p>}

                    {(persons.length > 0 || places.length > 0) && (
                        <div className={styles.notes}>
                            {persons.length > 0 && (
                                <section>
                                    <h3 className={styles.notesHeading}>People</h3>
                                    <ul className={styles.notesList}>
                                        {persons.map(person => <li key={person}>{person}</li>)}
                                    </ul>
                                </section>
                            )}
                            {places.length > 0 && (
                                <section>
                                    <h3 className={styles.notesHeading}>Places</h3>
                                    <ul className={styles.notesList}>
                                        {places.map(place => <li key={place}>{place}</li>)}
                                    </ul>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </article>
        </BaseModal>
    );
}

export default LocationModal;
