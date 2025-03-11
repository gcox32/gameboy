import React, { useState, useEffect } from 'react';
import GameElementsBar from '@/components/layout/GameElementsBar';
import ActiveParty from '@/components/pokemon/ActiveParty';
import GymBadgeCase from '@/components/pokemon/GymBadgeCase';
import TownMap from '@/components/pokemon/TownMap';
import Pokedex from '@/components/pokemon/Pokedex';
import TeamPhoto from '@/components/pokemon/TeamPhoto';
import styles from './styles.module.css';
import { useInGameMemoryWatcher } from '@/utils/MemoryWatcher';
import { useSettings } from '@/contexts/SettingsContext';

interface FullScreenContainerProps {
  background: string;
  fullscreenCanvasRef: React.RefObject<HTMLCanvasElement> | null;
  fullscreenContainerRef: React.RefObject<HTMLDivElement> | null;
  activeROM: any;
  activeState: any;
  inGameMemory: any;
  MBCRam: any;
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
  onPauseResume,
  intervalPaused
}: FullScreenContainerProps) {
  const [showActiveParty, setShowActiveParty] = useState(true);
  const [showGymBadgeCase, setShowGymBadgeCase] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showPokedex, setShowPokedex] = useState(false);
  const [showTeamPhoto, setShowTeamPhoto] = useState(false);
  const [currentMap, setCurrentMap] = useState(0);
  const [dynamicBackground, setDynamicBackground] = useState<string | null>(null);
  const [currentBackground, setCurrentBackground] = useState(background);
  const [previousBackground, setPreviousBackground] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { uiSettings } = useSettings();
  const { isDynamicBackground } = uiSettings;

  useInGameMemoryWatcher(inGameMemory, '0xD2F6', '0x67', '0x1', async (array: number[]) => {
    if (isDynamicBackground) {
      const currentMapByte = array[0];
      console.log('currentMapByte', currentMapByte);

      const location = await fetch(`/api/pokemon/gen-one/locations?gameId=001&locationId=${currentMapByte}`);
      const locationData = await location.json();
      console.log('locationData', locationData);
    
      setCurrentMap(currentMapByte);
      
      if (locationData.img) {
        const backgroundImage = locationsImgUrl + locationData.img;
        console.log('backgroundImage', backgroundImage);
        setDynamicBackground(backgroundImage);
      }
    } else {
      setDynamicBackground(null);
    }
  }, 2000);

  // Effect to handle background transitions
  useEffect(() => {
    if (dynamicBackground || background) {
      setPreviousBackground(currentBackground);
      setCurrentBackground(dynamicBackground || background);
      setIsTransitioning(true);
      
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 1000); // Match this with CSS transition duration
      
      return () => clearTimeout(timer);
    }
  }, [dynamicBackground, background]);

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
      <GameElementsBar
        elementsEnabled={activeROM && activeState}
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
      />
      {showActiveParty && <ActiveParty inGameMemory={inGameMemory} onPauseResume={onPauseResume} intervalPaused={intervalPaused} />}
      {showGymBadgeCase && <GymBadgeCase inGameMem={inGameMemory} />}
      {showMap && <TownMap />}
      {showPokedex && <Pokedex />}
      {showTeamPhoto && <TeamPhoto />}
    </div>
  );
}