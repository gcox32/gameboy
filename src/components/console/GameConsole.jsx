import React, { useEffect } from 'react';
import GameControls from './GameControls';
import GameDisplay from './GameDisplay';
import OnLight from './OnLight';

function Console({ isEmulatorOn }) {

    return (
        <div className="console-container" id="console">
            <OnLight isEmulatorOn={isEmulatorOn} />
            <GameDisplay />
            <GameControls />
        </div>
    );
}

export default Console;


