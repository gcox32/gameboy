import { CSSProperties, useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { Maximize2, Minimize2 } from "lucide-react";
import TownMapLocation from "./TownMapLocation";
import { getTilePosition, townMapSrc } from "./geometry";
import LocationModal from "@/components/pokemon/TownMap/LocationModal";
import { useGame } from "@/contexts/GameContext";
import { locations } from "@/utils/pokemon/locations";
import { getCurrentMapAddress, getMapLocation } from "@/utils/pokemon/maps";
import { sliceMemoryWithGBC, useInGameMemoryWatcher } from "@/utils/MemoryWatcher";
import { Location } from "@/types/pokemon";
import { SRAMArray } from "@/types";
import styles from "./styles.module.css";

interface TownMapProps {
    inGameMemory: SRAMArray | number[];
    gbcMemory?: SRAMArray | number[];
    isOpen: boolean;
    onClosed: () => void;
}

// Hold the folded map briefly before it opens
const UNFOLD_DELAY_MS = 200;
// Both flaps fold, then the map fades out. Matches the timings in styles.module.css
const MAP_SHUT_MS = 950;

function TownMap({ inGameMemory, gbcMemory, isOpen, onClosed }: TownMapProps) {
    const { rom } = useGame();
    const [isUnfolded, setIsUnfolded] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

    const currentMapAddress = getCurrentMapAddress(rom);
    // Read once up front so the marker is already placed as the map unfolds
    const [currentMapId, setCurrentMapId] = useState<number | null>(() => {
        if (currentMapAddress === null) return null;
        return sliceMemoryWithGBC(inGameMemory, gbcMemory, currentMapAddress, currentMapAddress + 1)[0] ?? null;
    });
    const handleCurrentMapBytes = useCallback((bytes: number[]) => setCurrentMapId(bytes[0]), []);

    useInGameMemoryWatcher(
        inGameMemory,
        currentMapAddress === null ? undefined : `0x${currentMapAddress.toString(16)}`,
        '0x0',
        '0x1',
        handleCurrentMapBytes,
        1000,
        gbcMemory
    );

    const currentLocation = currentMapId === null ? null : getMapLocation(rom, currentMapId);
    const markerPosition = currentLocation && getTilePosition(currentLocation.tileX, currentLocation.tileY);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsUnfolded(true), UNFOLD_DELAY_MS);
            return () => clearTimeout(timer);
        }
        setIsUnfolded(false);
        setIsExpanded(false);
        const timer = setTimeout(onClosed, MAP_SHUT_MS);
        return () => clearTimeout(timer);
    }, [isOpen, onClosed]);

    // The location modal handles Escape itself while it's open
    useEffect(() => {
        if (!isExpanded || selectedLocation) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                setIsExpanded(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isExpanded, selectedLocation]);

    return (
        <>
            <div
                className={clsx(styles.backdrop, isExpanded && styles.backdropVisible)}
                onClick={() => setIsExpanded(false)}
            />
            <div
                className={clsx(
                    styles.townMap,
                    isUnfolded && styles.unfolded,
                    isExpanded && styles.expanded,
                    !isOpen && styles.closing
                )}
                style={{ '--map-art': `url(${townMapSrc})` } as CSSProperties}
            >
                {/* The fold animation. Once it finishes, .flatMap covers it with a seamless copy */}
                <div className={styles.sheet}>
                    <div className={clsx(styles.panel, styles.panelCenter)}>
                        <div className={styles.art} />
                    </div>
                    <div className={clsx(styles.panel, styles.flap, styles.flapLeft)}>
                        <div className={clsx(styles.face, styles.faceInner)}>
                            <div className={styles.art} />
                        </div>
                        <div className={clsx(styles.face, styles.faceOuter)} />
                    </div>
                    <div className={clsx(styles.panel, styles.flap, styles.flapRight)}>
                        <div className={clsx(styles.face, styles.faceInner)}>
                            <div className={styles.art} />
                        </div>
                        <div className={clsx(styles.face, styles.faceOuter, styles.cover)}>
                            <span className={styles.coverRegion}>Kanto</span>
                            <span className={styles.coverTitle}>Town Map</span>
                        </div>
                    </div>
                </div>

                <div className={styles.flatMap} role="img" aria-label="Map of the Kanto region">
                    <div className={styles.flatArt} />
                </div>

                <div className={styles.mapArea}>
                    {locations.map(location => (
                        <TownMapLocation
                            key={`${location.title}-${location.x}-${location.y}`}
                            location={location}
                            onClick={() => setSelectedLocation(location)}
                        />
                    ))}
                    {markerPosition && (
                        <div
                            className={styles.marker}
                            style={{ left: `${markerPosition.left}%`, top: `${markerPosition.top}%` }}
                        />
                    )}
                    <button
                        type="button"
                        className={styles.expandButton}
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-label={isExpanded ? 'Shrink map' : 'Expand map'}
                        title={isExpanded ? 'Shrink map' : 'Expand map'}
                    >
                        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>

                {currentLocation && (
                    <div className={styles.hereLabel}>
                        <span className={styles.hereDot} />
                        Current location: <strong>{currentLocation.name}</strong>
                    </div>
                )}
            </div>
            {selectedLocation && (
                <LocationModal
                    isOpen
                    onClose={() => setSelectedLocation(null)}
                    location={selectedLocation}
                />
            )}
        </>
    );
}

export default TownMap;
