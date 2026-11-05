import { useState } from 'react';
import { SaveStateModel } from '@/types';
import { PartialSaveStateModel } from '@/components/modals/SaveStateManagement/SaveStateModal';
import { useModalPause } from '@/hooks/useModalPause';
import { useSettings } from '@/contexts/SettingsContext';

/**
 * Shared confirmation + save-state-modal wiring for the system controls
 * (power/reset/save/save-as), so the panel, session bar and mobile drawer
 * share one set of confirmation prompts and one Save State modal.
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
    const { uiSettings, updateUISettings } = useSettings();
    const skipConfirmation = uiSettings.skipConfirmations;
    const [activeROMData, setActiveROMData] = useState<SaveStateModel | null>(null);
    const { pauseForModal, resumeAfterModal } = useModalPause(intervalPaused, handlePauseResume);

    const handleActionWithConfirmation = (action: () => void, message: string) => {
        if (skipConfirmation) {
            action();
            return;
        }
        pauseForModal();
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
            handleActionWithConfirmation(() => {
                // The next game starts with no save, so its first Save must ask for a name
                setActiveROMData(null);
                handlePowerToggle();
            }, "Are you sure you want to turn off the game?");
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
            pauseForModal();
            setShowSaveStateModal(true);
        }
    };

    const handleSaveAs = () => {
        if (!isRomLoaded || !isEmulatorPlaying) return;
        pauseForModal();
        setShowSaveStateModal(true);
    };

    const confirmModalProps = {
        isOpen: showConfirmModal,
        onClose: () => {
            setShowConfirmModal(false);
            resumeAfterModal();
        },
        onConfirm: () => {
            if (confirmAction) confirmAction();
            setShowConfirmModal(false);
        },
        skipConfirmation,
        toggleSkipConfirmation: () => updateUISettings({ skipConfirmations: !skipConfirmation }),
    };

    const saveStateModalProps = {
        isOpen: showSaveStateModal,
        onClose: () => {
            setShowSaveStateModal(false);
            resumeAfterModal();
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
        handleActionWithConfirmation,
        handlePowerToggleConfirm,
        handleResetConfirm,
        handleSaveState,
        handleSaveAs,
        confirmModalMessage,
        confirmModalProps,
        saveStateModalProps,
    };
}
