import React from "react";
import BaseModal from "@/components/modals/BaseModal";
import Image from "next/image";
import styles from "./styles.module.css";
import { Gym } from '@/types/pokemon';

interface GymModalProps {
    isOpen: boolean;
    onClose: () => void;
    gym: Gym;
}

export default function GymModal({ isOpen, onClose, gym }: GymModalProps) {
    if (!isOpen) return null;
    
    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className={`${styles.modalContent} ${styles.gymModal}`}>
            {gym.leaderImage && (
                <Image
                    src={gym.leaderImage}
                    className={styles.gymLeaderImage}
                    alt={gym.leader}
                    layout="responsive"
                    width={300} 
                    height={300}
                />
            )}
            <div className={styles.gymDetails}>
                <h2 className={styles.gymTitle}>{gym.name}</h2>
                {gym.leaderDescription && <h3 className={styles.gymSubtitle}>{gym.leaderDescription}</h3>}
                <hr />
                <div className={styles.gymInfo}>
                    <p><strong>Gym Leader:</strong> {gym.leader}</p>
                    {gym.gymLocation && <p><strong>Location:</strong> {gym.gymLocation}</p>}
                    <p><strong>Badge:</strong> {gym.badge.name}</p>
                    {gym.badge.hm && (
                        <p><strong>HM Reward:</strong> {gym.badge.hm.name} {gym.badge.hm.hiddenMachine ? '(HM)' : '(TM)'}</p>
                    )}
                    {gym.badge.obeyLevel && (
                        <p><strong>Obey Level:</strong> Up to level {gym.badge.obeyLevel}</p>
                    )}
                    {gym.badge.statBoost && (
                        <p><strong>Stat Boost:</strong> +{gym.badge.statBoost}</p>
                    )}
                </div>
                {gym.description && (
                    <>
                        <hr />
                        <p className={styles.gymDescription}>{gym.description}</p>
                    </>
                )}
            </div>
        </BaseModal>
    );
}