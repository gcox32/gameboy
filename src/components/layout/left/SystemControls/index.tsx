import React from 'react';
import { Loader } from '@/components/ui';
import styles from './styles.module.css';
import buttons from '@/styles/buttons.module.css';
import { SaveStateModel } from '@/types';

interface SystemControlsProps {
	intervalPaused: boolean;
	onPauseResume: () => void;
    onReset: () => void;
	isEmulatorPlaying: boolean;
	onPowerToggle: () => void;
	onFullscreenToggle: () => void;
	isRomLoaded: boolean;
    userSaveStates: SaveStateModel[];
    isPanelVisible: boolean;
    isSaving: boolean;
    onOpenLoadStateModal: () => void;
    onSave: () => void;
    onSaveAs: () => void;
}

export default function SystemControls({
    intervalPaused,
    onPauseResume,
    onReset,
    isEmulatorPlaying,
    onPowerToggle,
    onFullscreenToggle,
    isRomLoaded,
    userSaveStates,
    isSaving,
    onOpenLoadStateModal,
    onSave,
    onSaveAs
}: SystemControlsProps) {
    return (
        <>
            <div className={styles.controlsContainer}>
				<div className={buttons.buttonGroup}>
					<button
                        onClick={onPowerToggle}
						disabled={!isRomLoaded}
						className={buttons.primaryButton}
					>
						{isEmulatorPlaying ? "Power Off" : "New Game"}
					</button>

					<button
						onClick={onPauseResume}
						disabled={!isEmulatorPlaying}
						className={buttons.secondaryButton}
					>
						{intervalPaused ? "Resume" : "Pause"}
					</button>

					<button
                        onClick={onReset}
						disabled={!isEmulatorPlaying}
						className={buttons.warningButton}
					>
						Reset
					</button>
				</div>

				<div className={buttons.buttonGroup}>
					<button
                        onClick={onOpenLoadStateModal}
						disabled={!isRomLoaded || isEmulatorPlaying || userSaveStates.length === 0}
						className={buttons.secondaryButton}
					>
						Load State
					</button>

					<button
                        onClick={onSave}
						disabled={!isEmulatorPlaying}
						className={buttons.primaryButton}
					>
						{isSaving ? <Loader /> : 'Save'}
					</button>

					<button
                        onClick={onSaveAs}
						disabled={!isEmulatorPlaying}
						className={buttons.primaryButton}
					>
						{isSaving ? <Loader /> : 'Save As'}
					</button>
				</div>

				<div className={buttons.buttonGroup}>
					<button
						onClick={onFullscreenToggle}
						disabled={!isRomLoaded}
						className={`${buttons.secondaryButton} ${buttons.desktop}`}
					>
						Fullscreen
					</button>
				</div>
            </div>
        </>
    );
}