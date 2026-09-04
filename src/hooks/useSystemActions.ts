import { useState } from 'react';
import { SaveStateModel } from '@/types';
import { PartialSaveStateModel } from '@/components/modals/SaveStateManagement/SaveStateModal';

/**
 * Shared confirmation + save-state-modal wiring for the system controls
 * (power/reset/save/save-as). Used by both the desktop ControlPanel and the
 * fullscreen icon strip so they share one set of confirmation prompts and
 * one Save State modal instead of duplicating the logic in each place.
 */
interface UseSystemActionsParams {
    isRomLoaded: boolean;
    isEmulatorPlaying: boolean;
    intervalPaused: boolean;
    handlePowerToggle: () => void;
    handleReset: () => void;
    handlePauseResume: () => void;
    onSaveConfirmed: (saveData: SaveStateModel, isSaveAs: boolean) => Promise<void>;
}

export function useSystemActions({
    isRomLoaded,
    isEmulatorPlaying,
    intervalPaused,
    handlePowerToggle,
    handleReset,
    handlePauseResume,
    onSaveConfirmed,
}: UseSystemActionsParams) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSaveStateModal, setShowSaveStateModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [confirmModalMessage, setConfirmModalMessage] = useState('');
    const [skipConfirmation, setSkipConfirmation] = useState(false);
    const [activeROMData, setActiveROMData] = useState<SaveStateModel | null>(null);

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

    const confirmModalProps = {
        isOpen: showConfirmModal,
        onClose: () => {
            setShowConfirmModal(false);
            if (intervalPaused) handlePauseResume();
        },
        onConfirm: () => {
            if (confirmAction) confirmAction();
            setShowConfirmModal(false);
        },
        skipConfirmation,
        toggleSkipConfirmation: () => setSkipConfirmation(!skipConfirmation),
    };

    const saveStateModalProps = {
        isOpen: showSaveStateModal,
        onClose: () => {
            setShowSaveStateModal(false);
            if (intervalPaused) handlePauseResume();
        },
        onConfirm: async (saveData: PartialSaveStateModel) => {
            try {
                await onSaveConfirmed(saveData as SaveStateModel, false);
                setActiveROMData(saveData as SaveStateModel);
                setShowSaveStateModal(false);
            } catch (error) {
                console.error('Error during save:', error);
            }
        },
        initialData: activeROMData as PartialSaveStateModel,
    };

    return {
        activeROMData,
        setActiveROMData,
        handlePowerToggleConfirm,
        handleResetConfirm,
        handleSaveState,
        handleSaveAs,
        confirmModalMessage,
        confirmModalProps,
        saveStateModalProps,
    };
}
