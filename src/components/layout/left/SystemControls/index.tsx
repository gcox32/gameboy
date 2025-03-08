import React, { useState } from 'react';
import { getUrl } from 'aws-amplify/storage';
import ConfirmModal from '@/components/modals/utilities/ConfirmModal';
import SaveStateModal from '@/components/modals/SaveStateManagement/SaveStateModal';
import LoadStateModal from '@/components/modals/SaveStateManagement/LoadStateModal';
import { Loader } from '@aws-amplify/ui-react';
import styles from './styles.module.css';

interface SaveState {
	id: string;
	title: string;
	description?: string;
	filePath: string;
	imageUrl?: string;
}

interface SaveModalData {
	title: string;
	description: string;
	img: string;
	imgFile: File;
}

interface SystemControlsProps {
	intervalPaused: boolean;
	onPauseResume: () => void;
	onReset: () => void;
	isEmulatorPlaying: boolean;
	onPowerToggle: () => void;
	onFullscreenToggle: () => void;
	isRomLoaded: boolean;
	onSaveConfirmed: (saveData: SaveModalData, isSaveAs: boolean) => Promise<void>;
	userSaveStates: SaveState[];
	runFromSaveState: (sramArray: number[], selectedSaveState: SaveState) => void;
	currentROM: {
		title: string;
		filePath: string;
	};
	isPanelVisible: boolean;
	currentUser: {
		userId: string;
	};
	isSaving: boolean;
}

export default function SystemControls({
	intervalPaused,
	onPauseResume,
	onReset,
	isEmulatorPlaying,
	onPowerToggle,
	onFullscreenToggle,
	isRomLoaded,
	onSaveConfirmed,
	userSaveStates,
	runFromSaveState,
	currentROM,
	currentUser,
	isSaving
}: SystemControlsProps) {
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [showSaveStateModal, setShowSaveStateModal] = useState(false);
	const [showLoadStateModal, setShowLoadStateModal] = useState(false);
	const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
	const [confirmModalMessage, setConfirmModalMessage] = useState('');
	const [skipConfirmation, setSkipConfirmation] = useState(false);
	const [activeROMData, setActiveROMData] = useState<SaveModalData | null>(null);

	const handleActionWithConfirmation = (action: () => void, message: string) => {
		if (skipConfirmation) {
			action();
			return;
		}
		
		if (!intervalPaused) onPauseResume();
		setConfirmModalMessage(message);
		setShowConfirmModal(true);
		setConfirmAction(() => action);
	};

	const handleResetConfirm = () => {
		handleActionWithConfirmation(onReset, "Are you sure you want to reset the game?");
	};

	const handlePowerToggleConfirm = () => {
		if (isRomLoaded && !isEmulatorPlaying) {
			onPowerToggle();
			return;
		}
		
		if (isEmulatorPlaying) {
			handleActionWithConfirmation(onPowerToggle, "Are you sure you want to turn off the game?");
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
			if (!intervalPaused) onPauseResume();
			setShowSaveStateModal(true);
		}
	};

	const handleSaveAs = () => {
		if (!isRomLoaded || !isEmulatorPlaying) return;
		
		if (!intervalPaused) onPauseResume();
		setShowSaveStateModal(true);
	};

	const handleLoadSaveState = async (selectedSaveState: SaveState ) => {
		try {
			const signedUrl = await getUrl({ path: selectedSaveState.filePath });
			const response = await fetch(signedUrl.url);
			
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const saveDataObject = JSON.parse(await response.text());
			const sramArray = saveDataObject.MBCRam;

			if (!sramArray || !Array.isArray(sramArray) || sramArray.length !== 32768) {
				throw new Error('Invalid or corrupted MBCRam data in the save state.');
			}

			runFromSaveState(sramArray, selectedSaveState);
			setShowLoadStateModal(false);
			setActiveROMData(selectedSaveState as unknown as SaveModalData);
		} catch (error) {
			console.error('Error loading save state:', error);
		}
	};

	return (
		<div className={styles.controlsContainer}>
			<div className={styles.buttonGroup}>
				<button 
					onClick={handlePowerToggleConfirm} 
					disabled={!isRomLoaded}
					className={styles.primaryButton}
				>
					{isEmulatorPlaying ? "Power Off" : "New Game"}
				</button>
				
				<button 
					onClick={onPauseResume} 
					disabled={!isEmulatorPlaying}
					className={styles.secondaryButton}
				>
					{intervalPaused ? "Resume" : "Pause"}
				</button>
				
				<button 
					onClick={handleResetConfirm} 
					disabled={!isEmulatorPlaying}
					className={styles.warningButton}
				>
					Reset
				</button>
			</div>

			<div className={styles.buttonGroup}>
				<button 
					onClick={() => setShowLoadStateModal(true)} 
					disabled={!isRomLoaded || isEmulatorPlaying || userSaveStates.length === 0}
					className={styles.secondaryButton}
				>
					Load State
				</button>
				
				<button 
					onClick={handleSaveState} 
					disabled={!isEmulatorPlaying}
					className={styles.primaryButton}
				>
					{isSaving ? <Loader /> : 'Save'}
				</button>
				
				<button 
					onClick={handleSaveAs} 
					disabled={!isEmulatorPlaying}
					className={styles.primaryButton}
				>
					{isSaving ? <Loader /> : 'Save As'}
				</button>
			</div>

			<div className={styles.buttonGroup}>
				<button 
					onClick={onFullscreenToggle} 
					disabled={!isRomLoaded}
					className={`${styles.secondaryButton} desktop`}
				>
					Fullscreen
				</button>
			</div>

			<ConfirmModal
				isOpen={showConfirmModal}
				onClose={() => {
					setShowConfirmModal(false);
					if (intervalPaused) onPauseResume();
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
					if (intervalPaused) onPauseResume();
				}}
				onConfirm={async (saveData: SaveModalData) => {
					try {
						await onSaveConfirmed(saveData, false);
						setActiveROMData(saveData);
						setShowSaveStateModal(false);
					} catch (error) {
						console.error('Error during save:', error);
					}
				}}
				initialData={activeROMData}
				currentROM={currentROM}
				userId={currentUser.userId}
			/>

			<LoadStateModal
				isOpen={showLoadStateModal}
				onClose={() => setShowLoadStateModal(false)}
				saveStates={userSaveStates}
				onConfirm={handleLoadSaveState}
				userId={currentUser.userId}
			/>
		</div>
	);
}