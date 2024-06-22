import React from 'react';
import GameControls from './GameControls';
import GameDisplay from './GameDisplay';
import OnLight from './OnLight';

function Console({ isEmulatorOn, mainCanvasRef, mobileZoom }) {

    return (
        <div className="console-container" id="console">
            <OnLight isEmulatorOn={isEmulatorOn} />
            <GameDisplay mainCanvasRef={mainCanvasRef} mobileZoom={mobileZoom}/>
            <GameControls />
        </div>
    );
}

export default Console;


