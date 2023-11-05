import React, { useState } from 'react';
import ConfirmModal from './modals/ConfirmModal';

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
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [wasPlayingBeforeModal, setWasPlayingBeforeModal] = useState(false);

    const handleResetConfirm = () => {
        if (isEmulatorPlaying) {
            setWasPlayingBeforeModal(!intervalPaused); // store the current playing state
            setShowConfirmModal(true);
            setConfirmAction(() => onReset);
            onPauseResume(); // pause the game
        }
    };

    const handlePowerToggleConfirm = () => {
        if (isRomLoaded && !isEmulatorPlaying) onPowerToggle()
        else if (isEmulatorPlaying && !intervalPaused) {
            setWasPlayingBeforeModal(isEmulatorPlaying && !intervalPaused); // store the current playing state
            setShowConfirmModal(true);
            setConfirmAction(() => onPowerToggle);
            if (isEmulatorPlaying) onPauseResume(); // pause the game
        }
    };

    const closeModal = () => {
        setShowConfirmModal(false);
        if (wasPlayingBeforeModal) {
            onPauseResume(); // only resume if it was playing before
        }
        setWasPlayingBeforeModal(false); // reset the state
    };

    const confirmModalAction = () => {
        if (confirmAction) {
            confirmAction(); // this will either turn off or reset the game
        }
        setWasPlayingBeforeModal(false); // reset the state
        setShowConfirmModal(false);
    };

    return (
        <div>
            <button id="pause-resume-btn" onClick={onPauseResume}>
                {intervalPaused ? "Resume" : "Pause"}
            </button>
            <button onClick={handleResetConfirm}>Reset</button>
            <button id="enable-sound" onClick={initSound}>
                {isSoundOn ? '🔊' : '🔇'} {/* Display different icons based on sound status */}
            </button>
            <input type="number" step="0.1" value={speed} onChange={onSpeedChange} />
            <button onClick={handlePowerToggleConfirm} disabled={!isRomLoaded}>
                {isEmulatorPlaying ? "Off" : "On"}
            </button>
            <button onClick={onFullscreenToggle}>Fullscreen</button>

            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={closeModal}
                onConfirm={confirmModalAction}
            >
                Are you sure you want to {isEmulatorPlaying ? "turn off" : "reset"} the game?
            </ConfirmModal>
        </div>
    );
}

export default SystemControls;

