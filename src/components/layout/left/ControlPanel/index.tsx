import React, { useEffect, useState, useCallback } from "react";
import Cartridges from "../Cartridges";
import SystemControls from "../SystemControls";
import HideShowButton from "@/components/common/HideShowButton";
import styles from './styles.module.css';
import ConfirmModal from "@/components/modals/utilities/ConfirmModal";
import SaveStateModal from "@/components/modals/SaveStateManagement/SaveStateModal";
import LoadStateModal from "@/components/modals/SaveStateManagement/LoadStateModal";
import GameManagement from "@/components/modals/GameManagement";
import { getUrl } from 'aws-amplify/storage';
import { AuthenticatedUser, GameModel, SaveStateModel } from '@/types';
import { PartialSaveStateModel } from "@/components/modals/SaveStateManagement/SaveStateModal";

interface ControlPanelProps {
    handleROMSelected: (rom: GameModel) => void;
    isEmulatorPlaying: boolean;
    activeSaveState: SaveStateModel;
    intervalPaused: boolean;
    handlePauseResume: () => void;
    handleReset: () => void;
    handlePowerToggle: () => void;
    toggleFullscreenMode: () => void;
    isRomLoaded: boolean;
    onSaveConfirmed: (saveData: SaveStateModel, isSaveAs: boolean) => Promise<void>;
    userSaveStates: SaveStateModel[];
    runFromSaveState: (sramArray: number[], selectedSaveState: SaveStateModel) => void;
    currentUser: AuthenticatedUser;
    isSaving: boolean;
    onDeleteSaveState: () => void;
    activeROM: GameModel | null;
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
    currentUser,
    isSaving,
    onDeleteSaveState,
    activeROM
}: ControlPanelProps) {
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSaveStateModal, setShowSaveStateModal] = useState(false);
    const [showLoadStateModal, setShowLoadStateModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [confirmModalMessage, setConfirmModalMessage] = useState('');
    const [skipConfirmation, setSkipConfirmation] = useState(false);
    const [activeROMData, setActiveROMData] = useState<SaveStateModel | null>(null);
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

    const handleActionWithConfirmation = (action: () => void, message: string) => {
        if (skipConfirmation) {
            action();
            return;
        }
        if (!intervalPaused) handlePauseResume();
        setConfirmModalMessage(message);
        setShowConfirmModal(true);
        setConfirmAction(() => action);
    };

    const handleResetConfirm = () => {
        handleActionWithConfirmation(handleReset, "Are you sure you want to reset the game?");
    };

    const handlePowerToggleConfirm = () => {
        if (isRomLoaded && !isEmulatorPlaying) {
            handlePowerToggle();
            return;
        }
        if (isEmulatorPlaying) {
            handleActionWithConfirmation(handlePowerToggle, "Are you sure you want to turn off the game?");
        }
    };

    const handleSaveState = async () => {
        if (!isRomLoaded || !isEmulatorPlaying) return;
        if (activeROMData) {
            try {
                await onSaveConfirmed(activeROMData, true);
            } catch (error) {
                console.error('Error during save:', error);
            }
        } else {
            if (!intervalPaused) handlePauseResume();
            setShowSaveStateModal(true);
        }
    };

    const handleSaveAs = () => {
        if (!isRomLoaded || !isEmulatorPlaying) return;
        if (!intervalPaused) handlePauseResume();
        setShowSaveStateModal(true);
    };

    const handleLoadSaveState = async (selectedSaveState: SaveStateModel) => {
        try {
            const signedUrl = await getUrl({ path: selectedSaveState.filePath });
            const response = await fetch(signedUrl.url);
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
            <div className={`${styles.controlPanel} ${isPanelVisible ? '' : styles.hidden}`}>
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
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => {
                    setShowConfirmModal(false);
                    if (intervalPaused) handlePauseResume();
                }}
                onConfirm={() => {
                    if (confirmAction) confirmAction();
                    setShowConfirmModal(false);
                }}
                skipConfirmation={skipConfirmation}
                toggleSkipConfirmation={() => setSkipConfirmation(!skipConfirmation)}
            >
                {confirmModalMessage}
            </ConfirmModal>

            <SaveStateModal
                isOpen={showSaveStateModal}
                onClose={() => {
                    setShowSaveStateModal(false);
                    if (intervalPaused) handlePauseResume();
                }}
                onConfirm={async (saveData: PartialSaveStateModel) => {
                    try {
                        await onSaveConfirmed(saveData as SaveStateModel, false);
                        setActiveROMData(saveData as SaveStateModel);
                        setShowSaveStateModal(false);
                    } catch (error) {
                        console.error('Error during save:', error);
                    }
                }}
                initialData={activeROMData as PartialSaveStateModel}
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