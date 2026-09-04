import { useEffect, useState, useCallback } from "react";
import Cartridges from "./Cartridges";
import SystemControls from "./SystemControls";
import HideShowButton from "@/components/common/HideShowButton";
import styles from './styles.module.css';
import LoadStateModal from "@/components/modals/SaveStateManagement/LoadStateModal";
import GameManagement from "@/components/modals/GameManagement";
import { AuthenticatedUser, GameModel, SaveStateModel } from '@/types';

interface ControlPanelProps {
    handleROMSelected: (rom: GameModel) => void;
    isEmulatorPlaying: boolean;
    activeSaveState: SaveStateModel | null;
    intervalPaused: boolean;
    handlePauseResume: () => void;
    toggleFullscreenMode: () => void;
    isRomLoaded: boolean;
    userSaveStates: SaveStateModel[];
    runFromSaveState: (sramArray: number[], selectedSaveState: SaveStateModel) => void;
    currentUser: AuthenticatedUser;
    isSaving: boolean;
    onDeleteSaveState: () => void;
    activeROM: GameModel | null;
    handlePowerToggleConfirm: () => void;
    handleResetConfirm: () => void;
    handleSaveState: () => void;
    handleSaveAs: () => void;
    setActiveROMData: (state: SaveStateModel | null) => void;
}

function ControlPanel({
    handleROMSelected,
    isEmulatorPlaying,
    activeSaveState,
    intervalPaused,
    handlePauseResume,
    toggleFullscreenMode,
    isRomLoaded,
    userSaveStates,
    runFromSaveState,
    currentUser,
    isSaving,
    onDeleteSaveState,
    activeROM,
    handlePowerToggleConfirm,
    handleResetConfirm,
    handleSaveState,
    handleSaveAs,
    setActiveROMData
}: ControlPanelProps) {
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [showLoadStateModal, setShowLoadStateModal] = useState(false);
    const [isGameManagementOpen, setIsGameManagementOpen] = useState(false);
    const [editingGame, setEditingGame] = useState<GameModel | null>(null);

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

    const handleLoadSaveState = async (selectedSaveState: SaveStateModel) => {
        try {
            // filePath is a Vercel Blob permanent URL — fetch directly
            const response = await fetch(selectedSaveState.filePath, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const saveDataObject = JSON.parse(await response.text());
            const sramArray = saveDataObject.MBCRam;
            if (!sramArray || !Array.isArray(sramArray)) {
                throw new Error('Invalid or corrupted MBCRam data in the save state.');
            }
            runFromSaveState(sramArray, selectedSaveState);
            setShowLoadStateModal(false);
            setActiveROMData(selectedSaveState);
        } catch (error) {
            console.error('Error loading save state:', error);
        }
    };

    const handleGameEdited = (updatedGame: GameModel) => {
        // If this is the currently selected ROM, reload it
        if (activeROM && activeROM.id === updatedGame.id) {
            handleROMSelected(updatedGame);
        }
    };

    const handleGameDeleted = () => {
        // this will trigger a refresh of the games list in Cartridges
        // the Cartridges component will handle the refresh internally
        // we could add a ref to Cartridges to call fetchGames if needed
    };

    return (
        <>
            <div data-theme="dark" className={`${styles.controlPanel} ${isPanelVisible ? '' : styles.hidden}`}>
                <Cartridges
                    onROMSelected={handleROMSelected}
                    isDisabled={isEmulatorPlaying}
                    activeSaveState={activeSaveState}
                    currentUser={currentUser}
                    onOpenGameManagement={() => setIsGameManagementOpen(true)}
                />
                <SystemControls
                    intervalPaused={intervalPaused}
                    onPauseResume={handlePauseResume}
                    onReset={handleResetConfirm}
                    isEmulatorPlaying={isEmulatorPlaying}
                    onPowerToggle={handlePowerToggleConfirm}
                    onFullscreenToggle={toggleFullscreenMode}
                    isRomLoaded={isRomLoaded}
                    userSaveStates={userSaveStates}
                    isPanelVisible={isPanelVisible}
                    isSaving={isSaving}
                    onOpenLoadStateModal={() => setShowLoadStateModal(true)}
                    onSave={handleSaveState}
                    onSaveAs={handleSaveAs}
                />

            </div>
            <HideShowButton
                onClick={togglePanel}
                isPanelVisible={isPanelVisible}
                mobile={false}
            />

            <LoadStateModal
                isOpen={showLoadStateModal}
                onClose={() => setShowLoadStateModal(false)}
                saveStates={userSaveStates}
                onConfirm={handleLoadSaveState}
                onDelete={onDeleteSaveState}
            />

            <GameManagement
                isOpen={isGameManagementOpen}
                onClose={() => {
                    setIsGameManagementOpen(false);
                    setEditingGame(null);
                }}
                onGameDeleted={handleGameDeleted}
                onGameEdited={handleGameEdited}
                editingGame={editingGame}
                setEditingGame={(game) => setEditingGame(game)}
            />

        </>
    )
}

export default ControlPanel
