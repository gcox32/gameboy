import { useEffect, useMemo, useState } from 'react';
import GymBadge from './GymBadge';
import GymModal from './GymModal';
import { parseMetadata, sliceMemoryWithGBC, useInGameMemoryWatcher } from '@/utils/MemoryWatcher';
import clsx from 'clsx';
import styles from './styles.module.css';
import { GameModel, MemoryWatcherConfig, SRAMArray } from '@/types';
import { badges as badgesData, gyms as gymsData } from '@/utils/pokemon/gyms';
import { Badge } from '@/types/pokemon';

interface GymBadgeCaseProps {
    inGameMem: number[];
    gbcMemory?: SRAMArray | number[];
    activeROM: GameModel;
    isOpen: boolean;
    onClosed: () => void;
}

const DEFAULT_WATCHER_CONFIG: MemoryWatcherConfig = {
    baseAddress: '0xD2F6',
    offset: '0x5F', // 0x60 is for original blue
    size: '0x1'
};

// Hold the closed case briefly before the lid swings open
const LID_OPEN_DELAY_MS = 200;
// Lid shut, a short pause, then the fade out. Matches the timings in styles.module.css
const CASE_SHUT_MS = 850;

// Each bit maps to a badge, ordered from LSB to MSB: Boulder (bit 0) to Earth (bit 7)
function toBadges(badgesByte: number) {
    return badgesData.map((badge, index) => ({
        ...badge,
        earned: ((badgesByte >> index) & 1) === 1
    }));
}

function GymBadgeCase({ inGameMem, gbcMemory, activeROM, isOpen, onClosed }: GymBadgeCaseProps) {
    const watcherConfig = useMemo(
        () => parseMetadata<MemoryWatcherConfig>(activeROM, 'gymBadges', DEFAULT_WATCHER_CONFIG),
        [activeROM]
    );
    // Read once up front so the lid opens onto the right badges, without replaying the earned animation
    const [badges, setBadges] = useState(() => {
        const address = parseInt(watcherConfig.baseAddress ?? '', 16) + parseInt(watcherConfig.offset ?? '', 16);
        return toBadges(sliceMemoryWithGBC(inGameMem, gbcMemory, address, address + 1)[0] ?? 0);
    });
    const [prevBadges, setPrevBadges] = useState(badges);
    const [isLidOpen, setIsLidOpen] = useState(false);
    const [selectedGym, setSelectedGym] = useState<typeof gymsData[0] | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsLidOpen(true), LID_OPEN_DELAY_MS);
            return () => clearTimeout(timer);
        }
        setIsLidOpen(false);
        const timer = setTimeout(onClosed, CASE_SHUT_MS);
        return () => clearTimeout(timer);
    }, [isOpen, onClosed]);

    useInGameMemoryWatcher(
        inGameMem,
        watcherConfig?.baseAddress,
        watcherConfig?.offset,
        watcherConfig?.size,
        (array: number[]) => {
            setPrevBadges(badges);
            setBadges(toBadges(array[0]));
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
            <div className={clsx(styles.badgesCase, !isOpen && styles.closing)}>
                <div className={`${styles.caseHalf} ${styles.tray}`}>
                    <div className={`${styles.felt} ${styles.badgeGrid}`}>
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
                </div>
                <div className={clsx(styles.lid, isLidOpen && styles.lidOpen)}>
                    <div className={`${styles.caseHalf} ${styles.lidFace} ${styles.lidInner}`}>
                        <div className={styles.felt} />
                        <div className={styles.clasp} />
                    </div>
                    <div className={`${styles.caseHalf} ${styles.lidFace} ${styles.lidOuter}`}>
                        <div className={styles.clasp} />
                    </div>
                </div>
                <div className={styles.hinge} />
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
