import React, { useEffect, useState, useCallback } from "react";
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
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    
    const togglePanel = useCallback(() => {
        setIsPanelVisible(prev => !prev);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isPanelVisible) {
                togglePanel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPanelVisible, togglePanel]);
    
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