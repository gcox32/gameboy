import React, { useState } from "react";
import Cartridges from "./Cartridges";
import SystemControls from "./SystemControls";
import ToggleButton from "./ToggleButton";

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
    currentUser
}) {
    const [isPanelVisible, setIsPanelVisible] = useState(true); // Panel is visible by default
    const togglePanel = () => {
        setIsPanelVisible(!isPanelVisible);
    };

    return (
        <div id="control-panel" className={isPanelVisible ? "visible" : "hidden"}>
            <Cartridges
                onROMSelected={handleROMSelected}
                isDisabled={isEmulatorPlaying}
                activeSaveState={activeSaveState}
            />
            <SystemControls
                intervalPaused={intervalPaused}
                onPauseResume={handlePauseResume}
                onReset={handleReset}
                speed={speed}
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
            />
            <ToggleButton
                onClick={togglePanel}
                isPanelVisible={isPanelVisible}
                mobile={false}
            />
        </div>
    )
}

export default ControlPanel