import React, { useState } from 'react';
import GameElementsBar from '@/components/layout/GameElementsBar';
import ActiveParty from '@/components/pokemon/ActiveParty';
import GymBadgeCase from '@/components/pokemon/GymBadgeCase';
import TownMap from '@/components/pokemon/TownMap';
import Pokedex from '@/components/pokemon/Pokedex';
import TeamPhoto from '@/components/pokemon/TeamPhoto';
import styles from './styles.module.css';
interface FullScreenContainerProps {
  background: string;
  fullscreenCanvasRef: React.RefObject<HTMLCanvasElement>;
  fullscreenContainerRef: React.RefObject<HTMLDivElement>;
  activeROM: any;
  activeState: any;
  inGameMemory: any;
  MBCRam: any;
  onPauseResume: () => void;
  intervalPaused: boolean;
}

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

  return (
    <div id="fullscreenContainer" className={styles.fullscreenContainer} ref={fullscreenContainerRef} style={{ backgroundImage: `url(${background})` }}>
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
          {showMap && <TownMap inGameMem={inGameMemory}/>}
          {showPokedex && <Pokedex />}
          {showTeamPhoto && <TeamPhoto />}
    </div>
  );
}