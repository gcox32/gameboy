import React from 'react';
import GameControls from './GameControls';
import GameDisplay from './GameDisplay';
import OnLight from './OnLight';

function Console({ isEmulatorOn, mainCanvasRef }) {

    return (
        <div className="console-container" id="console">
            <OnLight isEmulatorOn={isEmulatorOn} />
            <GameDisplay mainCanvasRef={mainCanvasRef}/>
            <GameControls />
        </div>
    );
}

export default Console;


