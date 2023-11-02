import React from 'react';
import { pause } from '../utils/GameBoyIO.js';

function SystemControls({ gameBoy, speed, initSound, onSpeedChange, isSoundOn }) {
    return (
        <div>
            <button onClick={() => gameBoy.run()}>Run</button>
            <button id="pause-btn" onClick={() => pause()}>Pause</button>
            <button onClick={() => gameBoy.reset()}>Reset</button>
            <button id="enable-sound" onClick={initSound}>
                {isSoundOn ? '🔊' : '🔇'} {/* Display different icons based on sound status */}
            </button>
            <input type="number" step="0.1" value={speed} onChange={onSpeedChange} />
        </div>
    );
}

export default SystemControls;

