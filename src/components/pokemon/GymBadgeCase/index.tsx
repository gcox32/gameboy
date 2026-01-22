import React, { useEffect, useState } from 'react';
import GymBadge from './GymBadge';
import GymModal from './GymModal';
import { parseMetadata, useInGameMemoryWatcher } from '@/utils/MemoryWatcher';
import styles from './styles.module.css';
import { GameModel, MemoryWatcherConfig, SRAMArray } from '@/types';
import { badges as badgesData, gyms as gymsData } from '@/utils/pokemon/gyms';
import { Badge } from '@/types/pokemon';

interface GymBadgeCaseProps {
    inGameMem: number[];
    gbcMemory?: SRAMArray | number[];
    activeROM: GameModel;
}

function GymBadgeCase({ inGameMem, gbcMemory, activeROM }: GymBadgeCaseProps) {
    const [badges, setBadges] = useState(badgesData.map(badge => ({
        ...badge,
        earned: false
    })));
    const [prevBadges, setPrevBadges] = useState(badgesData.map(badge => ({
        ...badge,
        earned: false
    })));
    const [watcherConfig, setWatcherConfig] = useState<MemoryWatcherConfig>({});
    const [selectedGym, setSelectedGym] = useState<typeof gymsData[0] | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    useEffect(() => {
        if (!activeROM) return;
        const watcherConfig = parseMetadata(activeROM, 'gymBadges', {
            baseAddress: '0xD2F6',
            offset: '0x5F', // 0x60 is for original blue
            size: '0x1'
        });
        setWatcherConfig(watcherConfig);
    }, [activeROM]);
    
    useInGameMemoryWatcher(
        inGameMem,
        watcherConfig?.baseAddress,
        watcherConfig?.offset,
        watcherConfig?.size,
        (array: number[]) => {
            const badgesByte = array[0];

            // Create new badges array by mapping each bit to a badge
            // Bits are ordered from LSB to MSB: Boulder (bit 0) to Earth (bit 7)
            const newBadges = badgesData.map((badge, index) => {
                const isEarned = ((badgesByte >> index) & 1) === 1;
                return {
                    ...badge,
                    earned: isEarned
                };
            });

            setPrevBadges(badges);
            setBadges(newBadges);
        },
        3000,
        gbcMemory
    );

    const handleBadgeClick = (badge: Badge, index: number) => {
        const gym = gymsData[index];
        if (gym) {
            setSelectedGym(gym);
            setIsModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedGym(null);
    };

    return (
        <>
            <div className={styles.badgesCase}>
                {badges.map((badge, index) => (
                    <GymBadge 
                        key={index} 
                        badge={{ ...badge, index }}
                        earned={badge.earned}
                        justEarned={badge.earned && !prevBadges[index].earned}
                        onBadgeClick={handleBadgeClick}
                    />
                ))}
            </div>
            {selectedGym && (
                <GymModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    gym={selectedGym}
                />
            )}
        </>
    );
}


export default GymBadgeCase;
