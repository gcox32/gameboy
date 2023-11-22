import React, { useState } from 'react';
import GameElementsBar from './pokemon/GameElementsBar';
import ActiveParty from './pokemon/ActiveParty';
import GymBadgeCase from './pokemon/BadgeCase';

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
  const [showActiveParty, setShowActiveParty] = useState(false);
  const [showGymBadgeCase, setShowGymBadgeCase] = useState(false);

  return (
    <div id="fullscreenContainer" ref={fullscreenContainerRef} style={{ backgroundImage: `url(${background})` }}>
      <canvas id="fullscreen" ref={fullscreenCanvasRef}></canvas>
      {activeROM && activeState && activeROM.series === 'Pokemon' ?
        <>
          <GameElementsBar
            onActivePartyClick={() => setShowActiveParty(!showActiveParty)}
            onGymBadgeCaseClick={() => setShowGymBadgeCase(!showGymBadgeCase)}
          />
          {showActiveParty && <ActiveParty MBCRam={MBCRam} onPauseResume={onPauseResume} intervalPaused={intervalPaused} />}
          {showGymBadgeCase && <GymBadgeCase MBCRamRef={MBCRam.current} />}
        </> : <></>
      }
    </div>
  );
}

export default FullScreenContainer;
