import React, { useState } from 'react';
import { Storage } from 'aws-amplify';
import ConfirmModal from './modals/ConfirmModal';
import SaveStateModal from './modals/SaveStateModal';
import LoadStateModal from './modals/LoadStateModal';

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
    isRomLoaded,
    onSaveConfirmed,
    userSaveStates,
    runFromSaveState
}) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSaveStateModal, setShowSaveStateModal] = useState(false);
    const [showLoadStateModal, setShowLoadStateModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmModalMessage, setConfirmModalMessage] = useState('');
    const [skipConfirmation, setSkipConfirmation] = useState(false);
    const [activeROMData, setActiveROMData] = useState(null);

    const handleActionWithConfirmation = (action, message) => {
        if (skipConfirmation) {
            action();
        } else {
            if (!intervalPaused) onPauseResume();
            setConfirmModalMessage(message);
            setShowConfirmModal(true);
            setConfirmAction(() => action);
        }
    };
    const handleResetConfirm = () => {
        handleActionWithConfirmation(onReset, "Are you sure you want to reset the game?");
    };
    const handlePowerToggleConfirm = () => {
        if (isRomLoaded && !isEmulatorPlaying) {
            onPowerToggle();
        } else if (isEmulatorPlaying) {
            handleActionWithConfirmation(onPowerToggle, "Are you sure you want to turn off the game?");
        }
    };
    const toggleSkipConfirmation = () => {
        setSkipConfirmation(!skipConfirmation);
    };
    const confirmModalAction = () => {
        if (confirmAction) {
            confirmAction(); // either turn off or reset the game
        }
        setShowConfirmModal(false);
    };
    const handleSave = () => {
        if (isRomLoaded && isEmulatorPlaying) {
            if (activeROMData) {
                onSaveConfirmed(activeROMData, true)
            } else {
                if (!intervalPaused) onPauseResume();
                setShowSaveStateModal(true);
            }
        }
    }
    const handleSaveAs = () => {
        if (isRomLoaded && isEmulatorPlaying) {
            if (!intervalPaused) onPauseResume();
            setShowSaveStateModal(true);
        }
    }
    const saveStateModalAction = async ({ title, description, img }) => {
        try {
            const saveModalData = { title, description, img };
            onSaveConfirmed(saveModalData);
            setActiveROMData(saveModalData);
            setShowSaveStateModal(false);
            if (intervalPaused) onPauseResume();
        } catch (error) {
            console.error('Failed to save game state:', error);
        }
    };
    const closeConfirmModal = () => {
        setShowConfirmModal(false)
        if (intervalPaused) onPauseResume();
    }
    const closeSaveStateModal = () => {
        setShowSaveStateModal(false)
        if (intervalPaused) onPauseResume();
    }
    const handleLoadSaveState = () => {
        setShowLoadStateModal(true); // State in your component to control modal visibility
    };
    const handleSelectSaveState = async (selectedSaveState) => {
        try {
            // Fetch the save data from S3 using the key from the selected save state
            const signedUrl = await Storage.get(selectedSaveState.filePath, {
                contentType: 'blob',
                level: 'private'
            });
            const response = await fetch(signedUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const sramArray = new Uint8Array(arrayBuffer);

            runFromSaveState(sramArray);
            setShowLoadStateModal(false);
        } catch (error) {
            console.error('Error loading save state:', error);
        }
    };

    return (
        <div>
            <button id="pause-resume-btn" onClick={onPauseResume} disabled={!isEmulatorPlaying}>
                {intervalPaused ? "Resume" : "Pause"}
            </button>
            <button onClick={handleResetConfirm} disabled={!isEmulatorPlaying}>Reset</button>
            <button id="enable-sound" onClick={initSound}>
                {isSoundOn ? '🔊' : '🔇'}
            </button>
            <input type="number" step="0.1" value={speed} onChange={onSpeedChange} disabled={!isRomLoaded} />
            <button onClick={handlePowerToggleConfirm} disabled={!isRomLoaded}>
                {isEmulatorPlaying ? "Off" : "On"}
            </button>
            <button onClick={onFullscreenToggle} disabled={!isRomLoaded}>Fullscreen</button>
            <button onClick={handleLoadSaveState} disabled={!isRomLoaded && !isEmulatorPlaying} id="load-btn">Load State</button>
            <button onClick={handleSave} disabled={!isEmulatorPlaying} >Save</button>
            <button onClick={handleSaveAs} disabled={!isEmulatorPlaying} >Save As</button>
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={closeConfirmModal}
                onConfirm={confirmModalAction}
                skipConfirmation={skipConfirmation}
                toggleSkipConfirmation={toggleSkipConfirmation}
            >
                <p>{confirmModalMessage}</p>
            </ConfirmModal>
            <SaveStateModal
                isOpen={showSaveStateModal}
                onClose={closeSaveStateModal}
                onConfirm={saveStateModalAction}
                initialData={activeROMData}
            >
            </SaveStateModal>
            <LoadStateModal
                isOpen={showLoadStateModal}
                onClose={() => setShowLoadStateModal(false)}
                saveStates={userSaveStates}
                onConfirm={handleSelectSaveState}
            >
            </LoadStateModal>
        </div>
    );
}

export default SystemControls;

