import React from 'react';
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

  return (
    <div id="fullscreenContainer" ref={fullscreenContainerRef} style={{ backgroundImage: `url(${background})` }}>
      <canvas id="fullscreen" ref={fullscreenCanvasRef}></canvas>
      {activeROM && activeState && activeROM.series === 'Pokemon' ?
        <>
          <ActiveParty
            MBCRam={MBCRam}
            onPauseResume={onPauseResume}
            intervalPaused={intervalPaused}
          />
          <GymBadgeCase MBCRamRef={MBCRam.current} />
        </> : <></>
      }
    </div>
  );
}

export default FullScreenContainer;
