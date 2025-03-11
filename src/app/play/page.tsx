"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUserSaveStates, loadInGameFile } from '@/utils/saveLoad';
import { useSettings } from '@/contexts/SettingsContext';
import { useGame } from '@/contexts/GameContext';
import { getCurrentUser } from 'aws-amplify/auth'
import { useSaveState } from '@/hooks/useSaveState';
import Console from '@/components/console/GameConsole';
import ControlPanel from '@/components/layout/left/ControlPanel';
import FullScreenContainer from '@/components/layout/FullScreenContainer';
import GameBoyCore from '@/utils/GameBoyCore';
import {
	registerGUIEvents,
	keyDown,
	keyUp
} from '@/utils/other/gui';
import {
	GameBoyEmulatorInitialized,
	GameBoyEmulatorPlaying,
	settings,
	clearLastEmulation
} from '@/utils/GameBoyIO';

interface ROM {
	id: string;
	title: string;
	backgroundImg?: string;
	filePath: string;
}

interface AuthenticatedUser {
	userId: string;
}

interface SaveState {
	id: string;
	title: string;
	filePath: string;
}

export default function App() {
	// Get settings from context
	const { uiSettings } = useSettings();
	const { speed, isSoundOn, mobileZoom } = uiSettings;

	// Refs to access the DOM elements
	const gameBoyInstance = useRef<any>(null);
	const runInterval = useRef<NodeJS.Timeout | null>(null);
	const mainCanvasRef = useRef<HTMLCanvasElement>(null);
	const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null);
	const fullscreenContainerRef = useRef<HTMLDivElement>(null);
	const mbcRamRef = useRef<any[]>([]);
	const inGameMemory = useRef<any[]>([]);

	// Maintain states
	const [currentUser, setUser] = useState<AuthenticatedUser | null>(null);
	const [ROMImage, setROMImage] = useState<string | null>(null);
	const [activeROM, setActiveROM] = useState<ROM | null>(null);
	const [userSaveStates, setUserSaveStates] = useState<any[]>([]);
	const [activeState, setActiveState] = useState<SaveState | null>(null);
	const [activeSaveArray, setActiveSaveArray] = useState<any[]>([]);
	const [isRomLoaded, setIsRomLoaded] = useState(false);
	const [intervalPaused, setIntervalPaused] = useState(false);
	const [isEmulatorPlaying, setIsEmulatorPlaying] = useState(false);
	const [isEmulatorOn, setIsEmulatorOn] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [fullscreenBackground, setFullscreenBackground] = useState('');

	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();

	const { startGame, stopGame } = useGame();

	// Add hook near other hooks
	const { saveState, isSaving } = useSaveState(
		gameBoyInstance.current,
		activeROM || { id: '', title: '', filePath: '' },
		currentUser?.userId || ''
	);

	// Update game context when emulator state changes
	useEffect(() => {
		if (isEmulatorPlaying && activeROM) {
			startGame({
				id: activeROM.id,
				title: activeROM.title
			});
		} else {
			stopGame();
		}
	}, [isEmulatorPlaying, activeROM, startGame, stopGame]);

	// Move checkAuthState to be defined with useCallback before its useEffect
	const checkAuthState = useCallback(async () => {
		try {
			const user = await getCurrentUser();
			setUser(user);
		} catch (error) {
			console.error('Not authenticated', error);
			router.push('login');
		} finally {
			setIsLoading(false);
		}
	}, [router]); // Add router as dependency since it's used in the function

	const run = (gameboyInstance: any) => {
		setIntervalPaused(false);
		if (GameBoyEmulatorInitialized(gameboyInstance)) {
			if (!GameBoyEmulatorPlaying(gameboyInstance)) {
				mbcRamRef.current = gameboyInstance.MBCRam;
				gameboyInstance.stopEmulator &= 1;
				console.log("Starting the iterator.");
				var dateObj = new Date();
				gameboyInstance.firstIteration = dateObj.getTime();
				gameboyInstance.iterations = 0;
				gameBoyInstance.current.setSpeed(speed);
				inGameMemory.current = gameBoyInstance.current.memory;
				runInterval.current = setInterval(function () {
					if (!document.hidden) {
						gameboyInstance.run();
					}
				}, settings[6]);
			} else {
				console.log("The GameBoy core is already running.");
			}
		} else {
			console.log("GameBoy core cannot run while it has not been initialized.");
		}
	};
	const handleROMSelected = async (selectedROM: ROM) => {
		if (selectedROM) {
			setActiveROM(selectedROM);
			setUserSaveStates(await fetchUserSaveStates(currentUser?.userId, selectedROM.id))
			console.log('User save states:', userSaveStates);
			console.log('Selected ROM:', selectedROM);
			console.log('Current user:', currentUser);
			try {
				const response = await loadInGameFile(selectedROM.filePath);
				if (!response.body) {
					throw new Error('Failed to load ROM file');
				}
				const blob = await response.body.blob();
				const reader = new FileReader();
				reader.onloadend = () => {
					setROMImage(reader.result as string);
					setIsRomLoaded(true);
				};
				reader.onerror = (error) => {
					console.error("Failed to read ROM:", error);
					setIsRomLoaded(false);
				};
				reader.readAsBinaryString(blob);
			} catch (error) {
				console.error("Failed to load ROM:", error);
				setIsRomLoaded(false);
			}
		} else {
			setROMImage(null);
			setIsRomLoaded(false);
		}
	};
	const handlePowerToggle = () => {
		if (gameBoyInstance.current && (isEmulatorPlaying || intervalPaused)) {
			console.log("Turning off the emulator...");
			if (mainCanvasRef.current) mainCanvasRef.current.style.opacity = '0';
			if (fullscreenCanvasRef.current) fullscreenCanvasRef.current.style.opacity = '0';
			if (runInterval.current) clearInterval(runInterval.current);
			setIsEmulatorPlaying(false);
			setIntervalPaused(false);
			setIsRomLoaded(true);
			setActiveState(null);
		} else {
			// Logic to initialize and start the emulator using the ROMImage from state
			if (gameBoyInstance.current && ROMImage) {
				console.log("Starting GameBoyCore instance...");
				const currentCanvas = gameBoyInstance.current.canvas;
				if (currentCanvas) {
					if (mainCanvasRef.current) mainCanvasRef.current.style.opacity = '1';
					if (fullscreenCanvasRef.current) fullscreenCanvasRef.current.style.opacity = '1';
					gameBoyInstance.current = new GameBoyCore(ROMImage, currentCanvas);
					gameBoyInstance.current.start();
					console.log("Calling run() function...");
					run(gameBoyInstance.current);
					setIsEmulatorPlaying(true);
				}
			} else {
				console.log("Game not selected. Cannot start.");
			}
		}
	};
	const keyDownHandler = (event: KeyboardEvent) => {
		if (gameBoyInstance.current && !intervalPaused) {
			keyDown(event, gameBoyInstance.current);
		} else {
			// console.error("GameBoy instance is not initialized.");
		}
	};
	const keyUpHandler = (event: KeyboardEvent) => {
		if (gameBoyInstance.current && !intervalPaused) {
			keyUp(event, gameBoyInstance.current);
		} else {
			// console.error("GameBoy instance is not initialized.");
		}
	}
	const handleReset = () => {
		if (ROMImage) {
			console.log("Resetting GameBoy with the same ROM...");
			if (runInterval.current) clearInterval(runInterval.current);
			setIsEmulatorPlaying(false);
			setIntervalPaused(false);
			const currentCanvas = isFullscreen ? fullscreenCanvasRef.current : mainCanvasRef.current;
			if (currentCanvas) {
				if (activeState) {
					gameBoyInstance.current = new GameBoyCore(ROMImage, currentCanvas, activeSaveArray);
				} else {
					gameBoyInstance.current = new GameBoyCore(ROMImage, currentCanvas);
				}
				gameBoyInstance.current.start();
				console.log("Calling run() function...");
				run(gameBoyInstance.current);
				setIsEmulatorPlaying(true);
			}
		}
	};
	const handlePauseResume = () => {
		if (GameBoyEmulatorInitialized(gameBoyInstance.current)) {
			if (GameBoyEmulatorPlaying(gameBoyInstance.current)) {
				console.log("Pausing...");
				clearLastEmulation(gameBoyInstance.current, runInterval);
				setIntervalPaused(true);
			} else {
				console.log("Resuming...");
				if (runInterval.current) {
					clearInterval(runInterval.current);
				}
				run(gameBoyInstance.current);
				setIntervalPaused(false);
			}
		} else {
			console.log("GameBoy core cannot be paused/resumed while it has not been initialized.", 1);
		}
	};
	const toggleFullscreenMode = useCallback(() => {
		console.log('Starting toggle fullscreen...');
		console.log('Screen orientation:', window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');

		if (window.innerWidth > window.innerHeight) {
			if (!isFullscreen) {
				console.log('Entering fullscreen mode...');
				if (fullscreenContainerRef.current) fullscreenContainerRef.current.style.display = "flex";
				if (gameBoyInstance.current && fullscreenCanvasRef.current) {
					console.log('Switching to fullscreen canvas...');
					gameBoyInstance.current.canvas = fullscreenCanvasRef.current;
				}
			} else {
				console.log('Exiting fullscreen mode...');
				if (fullscreenContainerRef.current) fullscreenContainerRef.current.style.display = "none";
				if (gameBoyInstance.current && mainCanvasRef.current) {
					console.log('Switching to main canvas...');
					gameBoyInstance.current.canvas = mainCanvasRef.current;
				}
			}
		} else {
			console.log('In portrait mode, using main canvas...');
			if (fullscreenContainerRef.current) fullscreenContainerRef.current.style.display = "none";
			if (gameBoyInstance.current && mainCanvasRef.current) {
				gameBoyInstance.current.canvas = mainCanvasRef.current;
			}
		}

		if (gameBoyInstance.current) {
			console.log('Initializing LCD...');
			gameBoyInstance.current.initLCD();
		}

		console.log('Setting fullscreen state to:', !isFullscreen);
		setIsFullscreen(!isFullscreen);
	}, [isFullscreen, gameBoyInstance]);
	const onSaveConfirmed = async (saveModalData: any, isUpdate = false) => {
		if (!gameBoyInstance.current || !activeROM || !isEmulatorPlaying) return;

		try {			
			// Only treat it as an update if we have an active state and isUpdate is true
			const saveData = isUpdate ? {
				...saveModalData,
				id: activeState?.id,
				filePath: activeState?.filePath,
			} : saveModalData;
			
			const savedState = await saveState(saveData, isUpdate);
			console.log('Saved successfully.');
			
			if (savedState) {
				setActiveState(savedState as SaveState);
				const userSaves = await fetchUserSaveStates(currentUser?.userId, activeROM.id);
				setUserSaveStates(userSaves);
				setActiveSaveArray(gameBoyInstance.current.saveSRAMState());
			} else {
				throw new Error('Save operation failed');
			}
		} catch (error) {
			console.error('Save failed:', error);
		}
	};
	const runFromSaveState = (sramArray: any[], selectedSaveState: any) => {
		console.log('Initiating state from load...');

		const currentCanvas = isFullscreen ? fullscreenCanvasRef.current : mainCanvasRef.current;
		if (mainCanvasRef.current) mainCanvasRef.current.style.opacity = '1';
		if (fullscreenCanvasRef.current) fullscreenCanvasRef.current.style.opacity = '1';
		gameBoyInstance.current = new GameBoyCore(ROMImage, currentCanvas, sramArray);
		gameBoyInstance.current.start();
		run(gameBoyInstance.current);
		setIsEmulatorPlaying(true);
		setActiveState(selectedSaveState as SaveState);
		setActiveSaveArray(sramArray);
	};
	const onDeleteSaveState = async () => {
		console.log('Deleting save state...');
		setUserSaveStates(await fetchUserSaveStates(currentUser?.userId, activeROM?.id));
	};

	useEffect(() => {
		checkAuthState();
	}, [checkAuthState]);

	// Register GUI events on load
	useEffect(() => {
		registerGUIEvents();
		//   console.log("Adding keydown event listener");
		window.addEventListener('keydown', keyDownHandler);
		window.addEventListener('keyup', keyUpHandler);
		return () => {
			// console.log("Removing keydown event listener");
			window.removeEventListener('keydown', keyDownHandler);
			window.removeEventListener('keyup', keyUpHandler);
		};
	},
		// eslint-disable-next-line
		[intervalPaused]
	);
	// Initialize gameBoyInstance with the first ROMImage on component mount
	useEffect(() => {
		if (ROMImage) {
			try {
				console.log("Clearing previous emulation...");
				clearLastEmulation(gameBoyInstance.current, runInterval);

				console.log("Creating new GameBoyCore instance...");
				const currentCanvas = isFullscreen ? fullscreenCanvasRef.current : mainCanvasRef.current;

				if (currentCanvas) {
					const instance = new GameBoyCore(ROMImage, currentCanvas);
					// Apply initial settings
					settings[0] = isSoundOn;
					instance.setSpeed(speed);
					gameBoyInstance.current = instance;
					console.log("GameBoyCore instance created. Waiting for start command.");
				}
			} catch (error) {
				console.error("Error during GameBoy instance initialization:", error);
			}
		}
		// Clear the interval when the component unmounts
		return () => {
			if (runInterval.current) {
				console.log("Clearing interval during cleanup");
				clearInterval(runInterval.current);
			}
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ROMImage, isRomLoaded]); // Explicitly ignore other dependencies
	
	// Add separate effect for handling settings changes
	useEffect(() => {
		if (gameBoyInstance.current && isEmulatorPlaying) {
			// Update speed
			gameBoyInstance.current.setSpeed(speed);

			// Update interval if running
			if (runInterval.current) {
				clearInterval(runInterval.current);
				runInterval.current = setInterval(() => {
					if (!document.hidden) {
						gameBoyInstance.current.run();
					}
				}, settings[6]);
			}

			// Update sound
			if (settings[0] !== isSoundOn) {
				settings[0] = isSoundOn;
				if (gameBoyInstance.current.audioHandle) {
					gameBoyInstance.current.initSound();
				}
			}
		}
	}, [speed, isSoundOn, isEmulatorPlaying]);

	// Maintain emulator-on awareness
	useEffect(() => {
		const isEmulatorOn = gameBoyInstance.current && (isEmulatorPlaying || intervalPaused);
		setIsEmulatorOn(isEmulatorOn);
	},
		[isEmulatorPlaying, intervalPaused] // Dependencies: Update when gameBoyInstance or intervalPaused changes
	);
	// Keep canvases clear when emulator off
	useEffect(() => {
		if (!isEmulatorOn) {
			if (mainCanvasRef.current) {
				const context = mainCanvasRef.current.getContext('2d');
				if (context) {
					context.clearRect(0, 0, mainCanvasRef.current.width, mainCanvasRef.current.height); // Clear the canvas
				}
				mainCanvasRef.current.style.visibility = 'hidden';
			}

			if (fullscreenCanvasRef.current) {
				const fsContext = fullscreenCanvasRef.current.getContext('2d');
				if (fsContext) {
					fsContext.clearRect(0, 0, fullscreenCanvasRef.current.width, fullscreenCanvasRef.current.height);
					fullscreenCanvasRef.current.style.visibility = 'hidden';
				}
			}
		}
	},
		[isEmulatorOn] // Removed the refs from the dependency array
	);
	// Listen for window resize to exit fullscreen mode
	useEffect(() => {
		const checkOrientationAndFullscreen = () => {
			if (window.innerWidth <= window.innerHeight && isFullscreen) {
				console.log('conditions met');
				toggleFullscreenMode(); // This will turn off fullscreen if the orientation isn't correct
			}
		};
		window.addEventListener('resize', checkOrientationAndFullscreen);

		return () => {
			window.removeEventListener('resize', checkOrientationAndFullscreen);
		};
	},
		[isFullscreen, toggleFullscreenMode]
	);
	// Listen for update to MBCRam
	useEffect(() => {
		if (gameBoyInstance.current && isEmulatorPlaying) {
			mbcRamRef.current = gameBoyInstance.current.MBCRam;
		}
	},
		[isEmulatorPlaying]
	);
	// Watch for background changes in settings
	useEffect(() => {
		if (!activeROM?.backgroundImg) {
			setFullscreenBackground(uiSettings.background);
		}
	}, [uiSettings.background, activeROM]);

	// Loading screen
	if (isLoading) {
		return <div>Loading...</div>;
	}

	// If user is not logged in, don't render anything
	if (!currentUser) {
		return null;
	}

	return (
		<div className="App">
			<ControlPanel 
				handleROMSelected={handleROMSelected}
				isEmulatorPlaying={isEmulatorPlaying}
				activeSaveState={activeState}
				intervalPaused={intervalPaused}
				handlePauseResume={handlePauseResume}
				handleReset={handleReset}
				handlePowerToggle={handlePowerToggle}
				toggleFullscreenMode={toggleFullscreenMode}
				isRomLoaded={isRomLoaded}
				onSaveConfirmed={onSaveConfirmed}
				userSaveStates={userSaveStates}
				runFromSaveState={runFromSaveState}
				currentUser={currentUser}
				isSaving={isSaving}
				onDeleteSaveState={onDeleteSaveState}
			/>
			<Console
				isEmulatorOn={isEmulatorOn}
				mainCanvasRef={mainCanvasRef as React.RefObject<HTMLCanvasElement>}
				mobileZoom={mobileZoom}
			/>
			<FullScreenContainer
				background={fullscreenBackground}
				fullscreenCanvasRef={fullscreenCanvasRef as React.RefObject<HTMLCanvasElement>}
				fullscreenContainerRef={fullscreenContainerRef as React.RefObject<HTMLDivElement>}
				activeROM={activeROM}
				activeState={activeState}
				inGameMemory={inGameMemory}
				onPauseResume={handlePauseResume}
				intervalPaused={intervalPaused}
				MBCRam={mbcRamRef.current}
			/>
		</div>
	);
}