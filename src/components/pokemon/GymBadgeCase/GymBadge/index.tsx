import React, { useState, useEffect } from 'react';
import { badgeImgPath } from '@/../config';
import styles from '../styles.module.css';
import Image from 'next/image';
import { Badge } from '@/types/pokemon';

interface GymBadgeProps {
    badge: {
        earned: boolean;
        name: string;
        image: string;
        index: number;
    };
    earned: boolean;
    justEarned: boolean;
    onBadgeClick: (badge: Badge, index: number) => void;
}

function GymBadge({ badge, earned, justEarned, onBadgeClick }: GymBadgeProps) {
    const [gleam, setGleam] = useState(false);
    const badgeClass = earned ? styles.earned : styles.unearned;

    useEffect(() => {
        if (justEarned) {
            // Wait for the badge to settle in before triggering the gleam
            setTimeout(() => setGleam(true), 1800);
            setTimeout(() => setGleam(false), 2800);
        }
    }, [justEarned]);

    const handleGleam = () => {
        if (earned && !justEarned) {  // Only allow manual gleam when not in earning animation
            setGleam(true);
            setTimeout(() => setGleam(false), 1000);
        }
    };

    const handleBadgeClick = () => {
        if (earned) {
            // Convert the badge data to the Badge type expected by the modal
            const badgeData: Badge = {
                name: badge.name,
                image: badge.image,
                giver: badge.name.split(' ')[0] + ' Badge', // Extract gym leader name from badge name
            };
            onBadgeClick(badgeData, badge.index);
        }
    };

    return (
        <div className={`${styles.badge} ${badgeClass} ${justEarned ? styles.animate : ''}`}>
            <div 
                className={`${styles.badgeImageWrapper} ${gleam ? styles.gleam : ''}`} 
                onClick={earned ? handleBadgeClick : handleGleam}
                style={{ cursor: earned ? 'pointer' : 'default' }}
            >
                <Image
                    src={`${badgeImgPath}${badge.image}`}
                    alt={badge.name}
                    title={badge.name}
                    className={earned ? '' : styles.silhouette}
                    loading="lazy"
                    draggable="false"
                    width={60}
                    height={60}
                    style={earned ? {} : { userSelect: 'none', pointerEvents: 'none' }}
                />
            </div>
        </div>
    );
}

export default GymBadge;
