import { useState } from "react";
import BaseModal from "@/components/modals/BaseModal";
import Image from "next/image";
import { badgeImgPath } from "@/../config";
import caseStyles from "../styles.module.css";
import styles from "./styles.module.css";
import { Badge, Gym } from '@/types/pokemon';

interface GymModalProps {
    isOpen: boolean;
    onClose: () => void;
    gym: Gym;
}

function getBadgePerks({ statBoost, hm, obeyLevel }: Badge) {
    const perks: string[] = [];
    if (statBoost) perks.push(`Boosts ${statBoost[0].toUpperCase()}${statBoost.slice(1)} in battle`);
    if (hm) perks.push(`Use ${hm.name} outside of battle`);
    if (obeyLevel) {
        perks.push(obeyLevel >= 100
            ? 'All traded Pokémon obey you'
            : `Traded Pokémon up to Lv. ${obeyLevel} obey you`);
    }
    return perks;
}

export default function GymModal({ isOpen, onClose, gym }: GymModalProps) {
    const [portraitFailed, setPortraitFailed] = useState(false);

    if (!isOpen) return null;

    const badgeImage = `${badgeImgPath}${gym.badge.image}`;

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className={`${styles.modalContent} ${styles.gymModal}`}>
            <div className={styles.card}>
                <div className={styles.portraitPanel}>
                    {gym.leaderImage && !portraitFailed ? (
                        <Image
                            src={gym.leaderImage}
                            className={styles.portrait}
                            alt={gym.leader}
                            width={1080}
                            height={1080}
                            sizes="280px"
                            onError={() => setPortraitFailed(true)}
                        />
                    ) : (
                        <Image src={badgeImage} alt="" width={80} height={80} className={styles.portraitFallback} />
                    )}
                </div>

                <div className={styles.info}>
                    <div className={styles.gymName}>{gym.name}</div>
                    <h2 className={styles.leaderName}>{gym.leader}</h2>
                    {gym.leaderDescription && <p className={styles.tagline}>{gym.leaderDescription}</p>}
                    {gym.description && <p className={styles.description}>{gym.description}</p>}

                    <div className={`${caseStyles.felt} ${styles.reward}`}>
                        <Image src={badgeImage} alt="" width={80} height={80} className={styles.rewardBadge} />
                        <div>
                            <div className={styles.rewardName}>{gym.badge.name}</div>
                            <ul className={styles.perks}>
                                {getBadgePerks(gym.badge).map(perk => <li key={perk}>{perk}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}
