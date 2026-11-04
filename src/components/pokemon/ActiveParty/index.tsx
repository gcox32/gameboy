import { useState, useEffect, useRef } from "react";
import PartySlot from "./PartySlot";
import { useInGameMemoryWatcher, parseMetadata } from "@/utils/MemoryWatcher";
import { parseParty } from "@/utils/pokemon/parse";
import PokemonDetailsModal from "@/components/pokemon/ActiveParty/DetailsModal";
import styles from "./styles.module.css";
import { ActivePartyProps, PokemonDetails } from "@/types/pokemon";
import { MemoryWatcherConfig } from "@/types";
import { FaExchangeAlt } from 'react-icons/fa';
import { useModalPause } from "@/hooks/useModalPause";
import clsx from "clsx";

const PARTY_SIZE = 6;
// Hold the closed balls briefly before they open
const BALLS_OPEN_DELAY_MS = 150;
// Balls shut in turn, then the belt fades out. Matches the timings in styles.module.css
const PARTY_SHUT_MS = 860;

function ActiveParty({ inGameMemory, gbcMemory, onPauseResume, intervalPaused, activeROM, isOpen, onClosed }: ActivePartyProps) {
    const partyArray = useRef([])
    const { pauseForModal, resumeAfterModal } = useModalPause(intervalPaused, onPauseResume);
    const [partyData, setPartyData] = useState<PokemonDetails[]>([]);
    const [selectedPokemonIndex, setSelectedPokemonIndex] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [watcherConfig, setWatcherConfig] = useState<MemoryWatcherConfig>({});
    const [useStadiumSprites, setUseStadiumSprites] = useState(false);
    const [areBallsOpen, setAreBallsOpen] = useState(false);
    const hasParty = partyData.length > 0;

    useEffect(() => {
        if (!isOpen) {
            setAreBallsOpen(false);
            const timer = setTimeout(onClosed, PARTY_SHUT_MS);
            return () => clearTimeout(timer);
        }
        if (!hasParty) {
            setAreBallsOpen(false);
            return;
        }
        const timer = setTimeout(() => setAreBallsOpen(true), BALLS_OPEN_DELAY_MS);
        return () => clearTimeout(timer);
    }, [isOpen, hasParty, onClosed]);

    useEffect(() => {
        if (!activeROM) return;
        const watcherConfig = parseMetadata(activeROM, 'activeParty', {
            baseAddress: '0xD163', // default fallback for Pokemon games
            offset: '0x00',
            size: '0x195'
        });
        setWatcherConfig(watcherConfig);
    }, [activeROM]);

    useInGameMemoryWatcher(
        inGameMemory,
        watcherConfig?.baseAddress,
        watcherConfig?.offset,
        watcherConfig?.size,
        (array: number[]) => {
            if (JSON.stringify(partyArray.current) !== JSON.stringify(array)) {
                try {
                    const parsedParty = parseParty(array);
                    setPartyData(parsedParty.pokemonList);
                    partyArray.current = array as never[];
                } catch {
                    console.log('Full party not interpretable.')
                    setPartyData([])
                    partyArray.current = []
                    handlePokemonModalClose();
                }
            }
        },
        1000,
        gbcMemory
    );

    const handlePokemonClick = (index: number) => {
        setSelectedPokemonIndex(index);
        setIsModalOpen(true);
        pauseForModal();
    };

    const handlePokemonModalClose = () => {
        resumeAfterModal();
        setIsModalOpen(false);
    };

    const cyclePokemon = (direction: number) => {
        if (partyData.length > 0) {
            let newIndex = selectedPokemonIndex as number + direction;
            if (newIndex < 0) newIndex = partyData.length - 1;
            else if (newIndex >= partyData.length) newIndex = 0;
            setSelectedPokemonIndex(newIndex);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isModalOpen) {
                if (e.key === 'ArrowLeft') {
                    cyclePokemon(-1);
                } else if (e.key === 'ArrowRight') {
                    cyclePokemon(1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    });

    return (
        <>
            {partyData.length > 0 && (
                <div className={clsx(styles.activeParty, !isOpen && styles.closing)}>
                    <button
                        type="button"
                        className={styles.buckle}
                        onClick={() => setUseStadiumSprites(!useStadiumSprites)}
                        title={`Switch to ${useStadiumSprites ? 'Game Boy' : 'Stadium'} sprites`}
                        aria-label={`Switch to ${useStadiumSprites ? 'Game Boy' : 'Stadium'} sprites`}
                    >
                        <FaExchangeAlt />
                    </button>
                    <div className={styles.partySlots}>
                        {Array.from({ length: PARTY_SIZE }, (_, index) => {
                            const pokemon = partyData[index];
                            return pokemon ? (
                                <PartySlot
                                    key={index}
                                    pokemon={pokemon}
                                    index={index}
                                    isBallOpen={areBallsOpen}
                                    onClick={() => handlePokemonClick(index)}
                                    useStadiumSprites={useStadiumSprites}
                                />
                            ) : (
                                <div key={index} className={styles.emptySocket} />
                            );
                        })}
                    </div>
                </div>
            )}
            {/* Outside the belt so it isn't trapped in the belt's stacking context */}
            {selectedPokemonIndex !== null && partyData.length > 0 && (
                <PokemonDetailsModal
                    isOpen={isModalOpen}
                    onClose={handlePokemonModalClose}
                    pokemon={partyData[selectedPokemonIndex]}
                    previousPokemon={partyData.length > 1 ? partyData[(selectedPokemonIndex - 1 + partyData.length) % partyData.length] : undefined}
                    nextPokemon={partyData.length > 1 ? partyData[(selectedPokemonIndex + 1) % partyData.length] : undefined}
                    onPrevious={() => cyclePokemon(-1)}
                    onNext={() => cyclePokemon(1)}
                />
            )}
        </>
    );
}

export default ActiveParty;