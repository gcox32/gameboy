import { useState, useEffect, useCallback, CSSProperties } from 'react';
import GameElementsBar from '@/components/layout/GameElementsBar';
import ActiveParty from '@/components/pokemon/ActiveParty';
import GymBadgeCase from '@/components/pokemon/GymBadgeCase';
import TownMap from '@/components/pokemon/TownMap';
import Pokedex from '@/components/pokemon/Pokedex';
import TeamPhoto from '@/components/pokemon/TeamPhoto';
import styles from './styles.module.css';
import { useInGameMemoryWatcher } from '@/utils/MemoryWatcher';
import { useEmulator } from '@/contexts/EmulatorContext';
import { useGame } from '@/contexts/GameContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getCurrentMapAddress, getMapImage } from '@/utils/pokemon/maps';
import { locationUrl } from '@/lib/assets';


export default function FullScreenContainer() {
  const {
    fullscreenBackground: background,
    fullscreenCanvasRef,
    fullscreenContainerRef,
    activeROM,
    activeState,
    inGameMemory: inGameMemoryRef,
    gbcMemory: gbcMemoryRef,
    handlePauseResume: onPauseResume,
    intervalPaused,
  } = useEmulator();
  const inGameMemory = inGameMemoryRef.current;
  const gbcMemory = gbcMemoryRef.current;

  const [showActiveParty, setShowActiveParty] = useState(true);
  // Stays true after hiding so the balls can shut before the belt is removed
  const [isPartyMounted, setIsPartyMounted] = useState(true);
  const handlePartyClosed = useCallback(() => setIsPartyMounted(false), []);
  const [showGymBadgeCase, setShowGymBadgeCase] = useState(false);
  // Stays true after hiding so the case can shut before it's removed
  const [isBadgeCaseMounted, setIsBadgeCaseMounted] = useState(false);
  const handleBadgeCaseClosed = useCallback(() => setIsBadgeCaseMounted(false), []);
  const [showMap, setShowMap] = useState(false);
  // Stays true after hiding so the map can fold shut before it's removed
  const [isMapMounted, setIsMapMounted] = useState(false);
  const handleMapClosed = useCallback(() => setIsMapMounted(false), []);
  const [showPokedex, setShowPokedex] = useState(false);
  // Stays true after hiding so the Pokédex can fade out before it's removed
  const [isPokedexMounted, setIsPokedexMounted] = useState(false);
  const handlePokedexClosed = useCallback(() => setIsPokedexMounted(false), []);
  const [showTeamPhoto, setShowTeamPhoto] = useState(false);
  const [dynamicBackground, setDynamicBackground] = useState<string | null>(null);
  const [currentBackground, setCurrentBackground] = useState(background);
  const [previousBackground, setPreviousBackground] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { uiSettings } = useSettings();
  const { isDynamicBackground } = uiSettings;
  const { rom } = useGame();
  const currentMapAddress = getCurrentMapAddress(rom);

  // The watcher stops without a ROM, so clear the artwork when the game stops
  useEffect(() => {
    if (!rom) setDynamicBackground(null);
  }, [rom]);

  useInGameMemoryWatcher(
    inGameMemory,
    currentMapAddress === null ? undefined : `0x${currentMapAddress.toString(16)}`,
    '0x0',
    '0x1',
    (array: number[]) => {
      if (isDynamicBackground && activeROM && activeState) {
        const image = getMapImage(rom, array[0]);
        if (image) setDynamicBackground(locationUrl('kanto', image));
      } else {
        setDynamicBackground(null);
      }
    },
    2000,
    gbcMemory
  );

  // Effect to handle background transitions
  useEffect(() => {
    if (dynamicBackground || background) {
      setPreviousBackground(currentBackground);
      setCurrentBackground(dynamicBackground || background);
      setIsTransitioning(true);

      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [dynamicBackground, background, currentBackground]);

  return (
    <div
      id="fullscreenContainer"
      className={styles.fullscreenContainer}
      ref={fullscreenContainerRef}
      style={{
        backgroundImage: `url(${currentBackground})`,
        ...(isTransitioning && {
          '--previous-background': `url(${previousBackground})`,
        } as CSSProperties),
      }}
    >
      <canvas id="fullscreen" className={styles.fullscreen} ref={fullscreenCanvasRef}></canvas>

      {activeROM && activeState && inGameMemory &&
      <GameElementsBar
        elementsEnabled={true}
        onActivePartyClick={() => {
          if (!showActiveParty) setIsPartyMounted(true);
          setShowActiveParty(!showActiveParty);
        }}
        onGymBadgeCaseClick={() => {
          if (!showGymBadgeCase) setIsBadgeCaseMounted(true);
          setShowGymBadgeCase(!showGymBadgeCase);
        }}
        onMapClick={() => {
          if (!showMap) setIsMapMounted(true);
          setShowMap(!showMap);
        }}
        onPokedexClick={() => {
          if (!showPokedex) setIsPokedexMounted(true);
          setShowPokedex(!showPokedex);
        }}
        onCameraClick={() => setShowTeamPhoto(!showTeamPhoto)}
        showActiveParty={showActiveParty}
        showGymBadgeCase={showGymBadgeCase}
        showMap={showMap}
        showPokedex={showPokedex}
        showTeamPhoto={showTeamPhoto}
      />}
      {isPartyMounted && activeROM && activeState && inGameMemory &&
        <ActiveParty
          inGameMemory={inGameMemory}
          gbcMemory={gbcMemory}
          onPauseResume={onPauseResume}
          intervalPaused={intervalPaused}
          activeROM={activeROM}
          isOpen={showActiveParty}
          onClosed={handlePartyClosed}
        />
      }
      {isBadgeCaseMounted && activeROM && activeState && inGameMemory &&
        <GymBadgeCase
          inGameMem={inGameMemory}
          gbcMemory={gbcMemory}
          activeROM={activeROM}
          isOpen={showGymBadgeCase}
          onClosed={handleBadgeCaseClosed}
        />
      }
      {isMapMounted && activeROM && activeState && inGameMemory &&
        <TownMap
          inGameMemory={inGameMemory}
          gbcMemory={gbcMemory}
          isOpen={showMap}
          onClosed={handleMapClosed}
        />
      }
      {isPokedexMounted && activeROM && activeState && inGameMemory &&
        <Pokedex
          inGameMemory={inGameMemory}
          gbcMemory={gbcMemory}
          isOpen={showPokedex}
          onClosed={handlePokedexClosed}
        />
      }
      {showTeamPhoto && activeROM && activeState && <TeamPhoto />}
    </div>
  );
}