import React, { useState, useEffect } from 'react';
import GameElementsBar from '@/components/layout/GameElementsBar';
import ActiveParty from '@/components/pokemon/ActiveParty';
import GymBadgeCase from '@/components/pokemon/GymBadgeCase';
import TownMap from '@/components/pokemon/TownMap';
import Pokedex from '@/components/pokemon/Pokedex';
import TeamPhoto from '@/components/pokemon/TeamPhoto';
import styles from './styles.module.css';
import { parseMetadata, useInGameMemoryWatcher } from '@/utils/MemoryWatcher';
import { useSettings } from '@/contexts/SettingsContext';
import { SRAMArray, SaveStateModel, GameModel, MemoryWatcherConfig } from '@/types';

interface FullScreenContainerProps {
  background: string;
  fullscreenCanvasRef: React.RefObject<HTMLCanvasElement> | null;
  fullscreenContainerRef: React.RefObject<HTMLDivElement> | null;
  activeROM: GameModel | null;
  activeState: SaveStateModel | null;
  inGameMemory: number[];
  mbcRam: SRAMArray | number[];
  onPauseResume: () => void;
  intervalPaused: boolean;
}

const locationsImgUrl = 'https://assets.letmedemo.com/public/gameboy/images/pokemon/locations/'

export default function FullScreenContainer({
  background,
  fullscreenCanvasRef,
  fullscreenContainerRef,
  activeROM,
  activeState,
  inGameMemory,
  mbcRam,
  onPauseResume,
  intervalPaused
}: FullScreenContainerProps) {

  const [showActiveParty, setShowActiveParty] = useState(true);
  const [showGymBadgeCase, setShowGymBadgeCase] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showPokedex, setShowPokedex] = useState(false);
  const [showTeamPhoto, setShowTeamPhoto] = useState(false);
  const [dynamicBackground, setDynamicBackground] = useState<string | null>(null);
  const [currentBackground, setCurrentBackground] = useState(background);
  const [previousBackground, setPreviousBackground] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [watcherConfig, setWatcherConfig] = useState<MemoryWatcherConfig>({});
  const { uiSettings } = useSettings();
  const { isDynamicBackground } = uiSettings;

  // Get location watcher config from ROM metadata or use defaults
  useEffect(() => {
    if (!activeROM) return;
    const watcherConfig = parseMetadata(activeROM, 'location', {
      baseAddress: '0xD2F6',
      offset: '0x67', // 0x68 is for original blue
      size: '0x1'
    });
    setWatcherConfig(watcherConfig);
  }, [activeROM]);

  useInGameMemoryWatcher(
    inGameMemory,
    watcherConfig?.baseAddress,
    watcherConfig?.offset,
    watcherConfig?.size,
    async (array: number[]) => {
      if (isDynamicBackground && activeROM && activeState) {
        const currentMapByte = array[0];

        const location = await fetch(`/api/pokemon/gen-one/locations?gameId=001&locationId=${currentMapByte}`);
        const locationData = await location.json();

        if (locationData.img) {
          const backgroundImage = locationsImgUrl + locationData.img;
          setDynamicBackground(backgroundImage);
        }
      } else {
        setDynamicBackground(null);
      }
    },
    2000
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
        } as React.CSSProperties),
      }}
    >
      <canvas id="fullscreen" className={styles.fullscreen} ref={fullscreenCanvasRef}></canvas>
      
      {activeROM && activeState && inGameMemory && 
      <GameElementsBar
        elementsEnabled={true}
        onActivePartyClick={() => setShowActiveParty(!showActiveParty)}
        onGymBadgeCaseClick={() => setShowGymBadgeCase(!showGymBadgeCase)}
        onMapClick={() => setShowMap(!showMap)}
        onPokedexClick={() => setShowPokedex(!showPokedex)}
        onCameraClick={() => setShowTeamPhoto(!showTeamPhoto)}
        showActiveParty={showActiveParty}
        showGymBadgeCase={showGymBadgeCase}
        showMap={showMap}
        showPokedex={showPokedex}
        showTeamPhoto={showTeamPhoto}
      />}
      {showActiveParty && activeROM && activeState && inGameMemory &&
        <ActiveParty
          inGameMemory={inGameMemory}
          onPauseResume={onPauseResume}
          intervalPaused={intervalPaused}
          activeROM={activeROM}
        />
      }
      {showGymBadgeCase && activeROM && activeState && inGameMemory &&
        <GymBadgeCase
          inGameMem={inGameMemory}
          activeROM={activeROM}
        />
      }
      {showMap && activeROM && activeState && <TownMap />}
      {showPokedex && activeROM && activeState && inGameMemory &&
        <Pokedex
          inGameMemory={mbcRam}
          activeROM={activeROM}
        />
      }
      {showTeamPhoto && activeROM && activeState && <TeamPhoto />}
    </div>
  );
}