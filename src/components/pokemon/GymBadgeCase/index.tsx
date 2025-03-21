import React, { useState } from 'react';
import GymBadge from './GymBadge';
import { useInGameMemoryWatcher } from '@/utils/MemoryWatcher';
import styles from './styles.module.css';

const badgesInfo = [
    { name: "Boulder Badge", image: "boulder.png" },
    { name: "Cascade Badge", image: "cascade.png" },
    { name: "Thunder Badge", image: "thunder.png" },
    { name: "Rainbow Badge", image: "rainbow.png" },
    { name: "Soul Badge",    image: "soul.png" },
    { name: "Marsh Badge",   image: "marsh.png" },
    { name: "Volcano Badge", image: "volcano.png" },
    { name: "Earth Badge",   image: "earth.png" },    
];

interface GymBadgeCaseProps {
    inGameMem: any[];
    activeROM: any;
}

function GymBadgeCase({ inGameMem, activeROM }: GymBadgeCaseProps) {
    const [badges, setBadges] = useState(badgesInfo.map(badge => ({
        ...badge,
        earned: false
    })));
    const [prevBadges, setPrevBadges] = useState(badgesInfo.map(badge => ({
        ...badge,
        earned: false
    })));

    const watcherConfig = activeROM?.metadata?.memoryWatchers?.gymBadges || {
        baseAddress: '0xD2F6',
        offset: '0x5F',
        size: '0x1'
    };

    useInGameMemoryWatcher(
        inGameMem,
        watcherConfig.baseAddress,
        watcherConfig.offset,
        watcherConfig.size,
        (array: any[]) => {
            const badgesByte = array[0];
            
            // Create new badges array by mapping each bit to a badge
            // Bits are ordered from LSB to MSB: Boulder (bit 0) to Earth (bit 7)
            const newBadges = badgesInfo.map((badge, index) => {
                const isEarned = ((badgesByte >> index) & 1) === 1;
                return {
                    ...badge,
                    earned: isEarned
                };
            });

            setPrevBadges(badges);
            setBadges(newBadges);
        },
        3000
    );

    return (
        <div className={styles.badgesCase}>
            {badges.map((badge, index) => (
                <GymBadge 
                    key={index} 
                    badge={{ ...badge, index }}
                    earned={badge.earned}
                    justEarned={badge.earned && !prevBadges[index].earned}
                />
            ))}
        </div>
    );
}


export default GymBadgeCase;
