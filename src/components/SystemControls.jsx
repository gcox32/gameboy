import React, { useState } from 'react';
import { getUrl } from 'aws-amplify/storage';
import ConfirmModal from './modals/ConfirmModal';
import SaveStateModal from './modals/SaveStateModal';
import LoadStateModal from './modals/LoadStateModal';
import { Authenticator } from '@aws-amplify/ui-react';
import { Loader } from '@aws-amplify/ui-react';

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
    runFromSaveState,
    currentROM,
    togglePanel,
    toggleMobileZoom,
    currentUser,
    s3ID
}) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSaveStateModal, setShowSaveStateModal] = useState(false);
    const [showLoadStateModal, setShowLoadStateModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmModalMessage, setConfirmModalMessage] = useState('');
    const [skipConfirmation, setSkipConfirmation] = useState(false);
    const [activeROMData, setActiveROMData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

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
    const handleSave = async () => {
        if (isRomLoaded && isEmulatorPlaying) {
            setIsSaving(true);
    
            if (activeROMData) {
                console.log(activeROMData);
                onSaveConfirmed(activeROMData, true)
                    .then(() => {
                        setIsSaving(false);
                    })
                    .catch((error) => {
                        console.error('Error during save:', error);
                        setIsSaving(false); 
                    });
            } else {
                if (!intervalPaused) onPauseResume();
                setShowSaveStateModal(true);
                setIsSaving(false);
            }
        }
    };
    const handleSaveAs = () => {
        if (isRomLoaded && isEmulatorPlaying) {
            if (!intervalPaused) onPauseResume();
            setShowSaveStateModal(true);
        }
    };
    const saveStateModalAction = async ({ title, description, img }) => {
        try {
            const saveModalData = { title, description, img };
            setIsSaving(true);
            onSaveConfirmed(saveModalData)
                .then(() => {
                    setIsSaving(false);
                    setActiveROMData(saveModalData);
                    setShowSaveStateModal(false);
                })
                .catch((error) => {
                    console.error('Error during save:', error);
                    setIsSaving(false); 
                });
        } catch (error) {
            console.error('Failed to save game state:', error);
            setIsSaving(false);
        }
    };
    const closeConfirmModal = () => {
        setShowConfirmModal(false)
        if (intervalPaused) onPauseResume();
    };
    const closeSaveStateModal = () => {
        setShowSaveStateModal(false)
        if (intervalPaused) onPauseResume();
    };
    const handleLoadSaveState = () => {
        setShowLoadStateModal(true); // State in your component to control modal visibility
    };
    const handleSelectSaveState = async (selectedSaveState) => {
        try {
            const signedUrl = await getUrl({ path: selectedSaveState.filePath });
            const response = await fetch(signedUrl.url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            // Retrieve the text (JSON string) from the response
            const jsonString = await response.text();
            // Parse the JSON string to an object
            const saveDataObject = JSON.parse(jsonString);
            console.log(saveDataObject);
            // Extract and use the MBCRam array
            const sramArray = saveDataObject.MBCRam;
            if (!sramArray || !Array.isArray(sramArray) || sramArray.length !== 32768) {
                throw new Error('Invalid or corrupted MBCRam data in the save state.');
            }

            console.log('SRAM Array Length:', sramArray.length);
            runFromSaveState(sramArray, selectedSaveState);
            setShowLoadStateModal(false);
            setActiveROMData(selectedSaveState);
        } catch (error) {
            console.error('Error loading save state:', error);
        }
    };

    return (
        <>
            <div className="control-buttons">
                <button onClick={handlePowerToggleConfirm} disabled={!isRomLoaded}>{isEmulatorPlaying ? "Off" : "New Game"}</button>
                <input className="speed-control" type="number" step="0.5" value={speed} onChange={onSpeedChange} disabled={!isRomLoaded} title="game speed multiple" />
                <button id="enable-sound" onClick={initSound} disabled={!isRomLoaded}>{isSoundOn ? 'Sound: Off' : 'Sound: On'}</button>
                <button id="pause-resume-btn" onClick={onPauseResume} disabled={!isEmulatorPlaying}>{intervalPaused ? "Resume" : "Pause"}</button>
                <button onClick={handleResetConfirm} disabled={!isEmulatorPlaying}>Reset</button>
                <button onClick={handleLoadSaveState} disabled={!isRomLoaded || isEmulatorPlaying || userSaveStates.length === 0} id="load-btn">Load State</button>
                <button onClick={handleSave} disabled={!isEmulatorPlaying} >{isSaving ? (<Loader />) : 'Save'}</button>
                <button onClick={handleSaveAs} disabled={!isEmulatorPlaying} >{isSaving ? (<Loader />) : 'Save As'}</button>
                <button onClick={onFullscreenToggle} disabled={!isRomLoaded} className="desktop">Fullscreen</button>
                <button onClick={togglePanel} className="mobile">Hide</button>
                <button onClick={toggleMobileZoom} className="mobile">Mobile Zoom</button>
                <Authenticator >{({ signOut }) => (<button onClick={signOut}>Logout</button>)}</Authenticator>
            </div>
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
                currentROM={currentROM}
                userId={currentUser.userId}
                s3ID={s3ID}
            >
            </SaveStateModal>
            <LoadStateModal
                isOpen={showLoadStateModal}
                onClose={() => setShowLoadStateModal(false)}
                saveStates={userSaveStates}
                onConfirm={handleSelectSaveState}
                userId={currentUser.userId}
                s3ID={s3ID}
            >
            </LoadStateModal>
        </ >
    );
}

export default SystemControls;

