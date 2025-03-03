import React, { useState } from "react";
import Cartridges from "../Cartridges";
import SystemControls from "../SystemControls";
import HideShowButton from "@/components/common/HideShowButton";
import styles from './styles.module.css';

interface ControlPanelProps {
    handleROMSelected: (rom: any) => void;
    isEmulatorPlaying: boolean;
    activeSaveState: any;
    intervalPaused: boolean;
    handlePauseResume: () => void;
    handleReset: () => void;
    speed: number;
    handlePowerToggle: () => void;
    toggleFullscreenMode: () => void;
    isRomLoaded: boolean;
    onSaveConfirmed: (saveData: any, isSaveAs: boolean) => Promise<void>;
    userSaveStates: any[];
    runFromSaveState: (sramArray: number[], selectedSaveState: any) => void;
    activeROM: any;
    currentUser: any;
    isSaving: boolean;
}

function ControlPanel({
    handleROMSelected,
    isEmulatorPlaying,
    activeSaveState,
    intervalPaused,
    handlePauseResume,
    handleReset,
    speed,
    handlePowerToggle,
    toggleFullscreenMode,
    isRomLoaded,
    onSaveConfirmed,
    userSaveStates,
    runFromSaveState,
    activeROM,
    currentUser,
    isSaving
}: ControlPanelProps) {
    const [isPanelVisible, setIsPanelVisible] = useState(true); // Panel is visible by default
    const togglePanel = () => {
        setIsPanelVisible(!isPanelVisible);
        console.log(isPanelVisible);
    };

    return (
        <div className={`${styles.controlPanel} ${isPanelVisible ? styles.visible : styles.hidden}`}>
            <Cartridges
                onROMSelected={handleROMSelected}
                isDisabled={isEmulatorPlaying}
                activeSaveState={activeSaveState}
                currentUser={currentUser}
            />
            <SystemControls
                intervalPaused={intervalPaused}
                onPauseResume={handlePauseResume}
                onReset={handleReset}
                isEmulatorPlaying={isEmulatorPlaying}
                onPowerToggle={handlePowerToggle}
                onFullscreenToggle={toggleFullscreenMode}
                isRomLoaded={isRomLoaded}
                onSaveConfirmed={onSaveConfirmed}
                userSaveStates={userSaveStates}
                runFromSaveState={runFromSaveState}
                currentROM={activeROM}
                togglePanel={togglePanel}

                isPanelVisible={isPanelVisible}
                currentUser={currentUser}
                isSaving={isSaving}
            />
            <HideShowButton
                onClick={togglePanel}
                isPanelVisible={isPanelVisible}
                mobile={false}
            />
        </div>
    )
}

export default ControlPanel