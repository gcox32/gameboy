import React, { useRef } from 'react';
import GameBoyCore from '../../utils/GameBoyCore';
import GameControls from './GameControls';
import GameDisplay from './GameDisplay';
import OnLight from './OnLight';

function Console({ ROMImage }) {
    const gameBoyInstance = useRef(new GameBoyCore()); // Assuming GameBoyCore is accessible
    if (ROMImage) {
        return (
            <div className="console-container" id="console">
                <OnLight />
                <GameDisplay gameBoyInstance={gameBoyInstance} ROMImage={ROMImage} />
                <GameControls gameBoy={gameBoyInstance.current} />
            </div>
        );
    } else {
        return (
            <div className="console-container" id="console">
                <OnLight />
                <GameDisplay gameBoyInstance={gameBoyInstance} ROMImage={null} />
                <GameControls gameBoy={gameBoyInstance.current} />
            </div>
        )
    }
}
export default Console;

