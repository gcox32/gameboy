import React, { useState } from 'react';
import GameElementsBar from './pokemon/GameElementsBar';
import ActiveParty from './pokemon/ActiveParty';
import GymBadgeCase from './pokemon/BadgeCase';
import TownMap from './pokemon/TownMap';
import Pokedex from './pokemon/Pokedex';
import TeamPhoto from './pokemon/TeamPhoto';

function FullScreenContainer({
  background,
  fullscreenCanvasRef,
  fullscreenContainerRef,
  activeROM,
  activeState,
  inGameMemory,
  MBCRam,
  onPauseResume,
  intervalPaused
}) {
  const [showActiveParty, setShowActiveParty] = useState(true);
  const [showGymBadgeCase, setShowGymBadgeCase] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showPokedex, setShowPokedex] = useState(false);
  const [showTeamPhoto, setShowTeamPhoto] = useState(false);

  return (
    <div id="fullscreenContainer" ref={fullscreenContainerRef} style={{ backgroundImage: `url(${background})` }}>
      <canvas id="fullscreen" ref={fullscreenCanvasRef}></canvas>
      {activeROM && activeState && activeROM.series === 'Pokemon' ?
        <>
          <GameElementsBar
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
        </> : <></>
      }
    </div>
  );
}

export default FullScreenContainer;
