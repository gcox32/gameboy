import React from 'react';
import ActiveParty from './pokemon/ActiveParty';

function FullScreenContainer({ background, fullscreenCanvasRef, fullscreenContainerRef, activeROM, activeState, MBCRam }) {

  return (
    <div id="fullscreenContainer" ref={fullscreenContainerRef} style={{ backgroundImage: `url(${background})` }}>
      <canvas id="fullscreen" ref={fullscreenCanvasRef}></canvas>
      {activeROM && activeState && activeROM.series === 'Pokemon' ?
        <ActiveParty
          MBCRam={MBCRam}
        /> : <></>
      }
    </div>
  );
}

export default FullScreenContainer;
