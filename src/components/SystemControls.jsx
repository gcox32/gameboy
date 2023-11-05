import React from 'react';

function SystemControls({ 
    intervalPaused, 
    onPauseResume, 
    onReset, 
    initSound, 
    isSoundOn, 
    speed, 
    onSpeedChange, 
    isEmulatorPlaying, 
    onPowerToggle, 
    onFullscreenToggle,
    isRomLoaded
}) {
    return (
        <div>
            <button id="pause-resume-btn" onClick={onPauseResume}>
                {intervalPaused ? "Resume" : "Pause"}
            </button>
            <button onClick={onReset}>Reset</button>
            <button id="enable-sound" onClick={initSound}>
                {isSoundOn ? '🔊' : '🔇'} {/* Display different icons based on sound status */}
            </button>
            <input type="number" step="0.1" value={speed} onChange={onSpeedChange} />
            <button onClick={onPowerToggle} disabled={!isRomLoaded}>
                {isEmulatorPlaying ? "Off" : "On"}
            </button>
            <button onClick={onFullscreenToggle}>Fullscreen</button>
        </div>
    );
}

export default SystemControls;

