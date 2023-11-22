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
  MBCRam,
  onPauseResume,
  intervalPaused
}) {
  const [showActiveParty, setShowActiveParty] = useState(true);
  const [showGymBadgeCase, setShowGymBadgeCase] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [showPokedex, setShowPokedex] = useState(true);
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
          />
          {showActiveParty && <ActiveParty MBCRam={MBCRam} onPauseResume={onPauseResume} intervalPaused={intervalPaused} />}
          {showGymBadgeCase && <GymBadgeCase MBCRamRef={MBCRam.current} />}
          {showMap && <TownMap />}
          {showPokedex && <Pokedex />}
          {showTeamPhoto && <TeamPhoto />}
        </> : <></>
      }
    </div>
  );
}

export default FullScreenContainer;
