"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Console from '../../components/console/GameConsole';
import ControlPanel from '../../components/ControlPanel';
import FullScreenContainer from '../../components/FullScreenContainer';
import GameBoyCore from '../../utils/GameBoyCore';
import {
	registerGUIEvents,
	keyDown,
	keyUp
} from '../../utils/other/gui';
import {
	GameBoyEmulatorInitialized,
	GameBoyEmulatorPlaying,
	settings,
	clearLastEmulation
} from '../../utils/GameBoyIO';
import { saveSRAM, fetchUserSaveStates } from '../../utils/saveLoad';
import { publicGamesEndpoint, backgroundEndpoint } from '../../../config';
import { useSettings } from '@/contexts/SettingsContext';
import { useGame } from '@/contexts/GameContext';

// Amplify auth
import { Amplify } from 'aws-amplify';
import { getCurrentUser } from 'aws-amplify/auth'
import awsconfig from '../../aws-exports';

// Add import
import { useSaveState } from '@/hooks/useSaveState';

Amplify.configure(awsconfig);

export default function App() {

	// Get settings from context
	const { uiSettings, updateUISettings, emulatorSettings } = useSettings();
	const { speed, isSoundOn, mobileZoom } = uiSettings;	

	// Refs to access the DOM elements
	const gameBoyInstance = useRef(null);
	const runInterval = useRef(null);
	const mainCanvasRef = useRef(null);
	const fullscreenCanvasRef = useRef(null);
	const fullscreenContainerRef = useRef(null);
	const mbcRamRef = useRef([null]);
	const inGameMemory = useRef([null])

	// Maintain states
	const [currentUser, setUser] = useState([]);
	const [ROMImage, setROMImage] = useState(null);
	const [activeROM, setActiveROM] = useState(null);
	const [userSaveStates, setUserSaveStates] = useState([])
	const [activeState, setActiveState] = useState(null);
	const [activeSaveArray, setActiveSaveArray] = useState([]);
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
	const { saveState, isSaving, error } = useSaveState(gameBoyInstance.current, activeROM, currentUser.userId);

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
	}, [isEmulatorPlaying, activeROM]);

	// Add this effect to sync settings with the emulator
	useEffect(() => {
		if (gameBoyInstance.current && isEmulatorPlaying) {
			// Update speed
			gameBoyInstance.current.setSpeed(speed);
			
			// Update interval if running
			if (runInterval.current) {
				clearInterval(runInterval.current);
				runInterval.current = setInterval(() => {
					if (!document.hidden && !document.msHidden && !document.mozHidden && !document.webkitHidden) {
						gameBoyInstance.current.run();
					}
				}, settings[6]); // settings[6] is the interval
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

	useEffect(() => {
		checkAuthState();
	}, []);

	async function checkAuthState() {
		try {
			const user = await getCurrentUser();
			setUser(user);
		} catch (error) {
			console.error('Not authenticated', error);
			router.push('/auth/login');
		} finally {
			setIsLoading(false);
		}
	};
	const run = (gameboyInstance) => {
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
					if (!document.hidden && !document.msHidden && !document.mozHidden && !document.webkitHidden) {
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
	const handleROMSelected = async (selectedROM) => {
		if (selectedROM) {
			setActiveROM(selectedROM);
			setUserSaveStates(await fetchUserSaveStates(currentUser.userId, selectedROM.id))
			updateBackgroundForFullscreen(selectedROM.backgroundImg);
			const romUrl = `${publicGamesEndpoint}${selectedROM.filePath}`;
			console.log('Current user:', currentUser);
			try {
				const response = await fetch(romUrl);
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const blob = await response.blob();
				const reader = new FileReader();
				reader.onloadend = () => {
					setROMImage(reader.result);
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
	const updateBackgroundForFullscreen = (backgroundData) => {
		if (backgroundData) {
			const backgroundUrl = `${backgroundEndpoint}${backgroundData}`;
			setFullscreenBackground(backgroundUrl);
		} else {
			setFullscreenBackground('');
		}
	};
	const handlePowerToggle = () => {
		if (gameBoyInstance.current && (isEmulatorPlaying || intervalPaused)) {
			console.log("Turning off the emulator...");
			mainCanvasRef.current.style.opacity = 0;
			fullscreenCanvasRef.current.style.opacity = 0;
			clearInterval(runInterval.current);
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
					mainCanvasRef.current.style.opacity = 1;
					fullscreenCanvasRef.current.style.opacity = 1;
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
	const keyDownHandler = (event) => {
		if (gameBoyInstance.current && !intervalPaused) {
			keyDown(event, gameBoyInstance.current);
		} else {
			// console.error("GameBoy instance is not initialized.");
		}
	};
	const keyUpHandler = (event) => {
		if (gameBoyInstance.current && !intervalPaused) {
			keyUp(event, gameBoyInstance.current);
		} else {
			// console.error("GameBoy instance is not initialized.");
		}
	}

	const handleReset = () => {
		if (ROMImage) {
			console.log("Resetting GameBoy with the same ROM...");
			clearInterval(runInterval.current);
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
				fullscreenContainerRef.current.style.display = "flex";
				if (gameBoyInstance.current && fullscreenCanvasRef.current) {
					console.log('Switching to fullscreen canvas...');
					gameBoyInstance.current.canvas = fullscreenCanvasRef.current;
				}
			} else {
				console.log('Exiting fullscreen mode...');
				fullscreenContainerRef.current.style.display = "none";
				if (gameBoyInstance.current && mainCanvasRef.current) {
					console.log('Switching to main canvas...');
					gameBoyInstance.current.canvas = mainCanvasRef.current;
				}
			}
		} else {
			console.log('In portrait mode, using main canvas...');
			fullscreenContainerRef.current.style.display = "none";
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

	// Replace existing onSaveConfirmed with new version
	const onSaveConfirmed = async (saveModalData, isUpdate = false) => {
		if (!gameBoyInstance.current || !activeROM || !isEmulatorPlaying) return;

		try {
			const savedState = await saveState(saveModalData, isUpdate);
			setActiveState(savedState);
			mbcRamRef.current = gameBoyInstance.current.MBCRam;
			const userSaves = await fetchUserSaveStates(currentUser.userId, activeROM.id);
			setUserSaveStates(userSaves);
			setActiveSaveArray(gameBoyInstance.current.saveSRAMState());
		} catch (error) {
			console.error('Save failed:', error);
		}
	};
	const runFromSaveState = (sramArray, selectedSaveState) => {
		console.log('Initiating state from load...');

		const currentCanvas = isFullscreen ? fullscreenCanvasRef.current : mainCanvasRef.current;
		mainCanvasRef.current.style.opacity = 1;
		fullscreenCanvasRef.current.style.opacity = 1;
		gameBoyInstance.current = new GameBoyCore(ROMImage, currentCanvas, sramArray);
		gameBoyInstance.current.start();
		run(gameBoyInstance.current);
		setIsEmulatorPlaying(true);
		setActiveState(selectedSaveState);
		setActiveSaveArray(sramArray);
	};

	// Maintain authenticated user information
	useEffect(() => {
		const loadUser = () => {
			return getCurrentUser();
		}
		const onLoad = async () => {
			try {
				const user = await loadUser();
				setUser(user);

			} catch (err) {
				console.error(err);
			}
		}
		onLoad();
	},
		[]
	);
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
                    settings[0] = isSoundOn; // Set initial sound state
                    gameBoyInstance.current = new GameBoyCore(ROMImage, currentCanvas);
                    gameBoyInstance.current.setSpeed(speed); // Set initial speed
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
    }, [ROMImage, isRomLoaded]
	);

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
				context.clearRect(0, 0, mainCanvasRef.current.width, mainCanvasRef.current.height); // Clear the canvas
				mainCanvasRef.current.style.visibility = 'hidden';
			}

			if (fullscreenCanvasRef.current) {
				const fsContext = fullscreenCanvasRef.current.getContext('2d');
				fsContext.clearRect(0, 0, fullscreenCanvasRef.current.width, fullscreenCanvasRef.current.height);
				fullscreenCanvasRef.current.style.visibility = 'hidden';
			}
		}
	},
		[isEmulatorOn] // Removed the refs from the dependency array
	);
	// Listen for window resize or escape key to exit fullscreen mode
	useEffect(() => {
		const checkOrientationAndFullscreen = () => {
			if (window.innerWidth <= window.innerHeight && isFullscreen) {
				console.log('conditions met');
				toggleFullscreenMode(); // This will turn off fullscreen if the orientation isn't correct
			}
		};
		const handleKeyDown = (event) => {
			if (event.key === 'Escape' && isFullscreen) {
				toggleFullscreenMode();
			}
		};

		window.addEventListener('resize', checkOrientationAndFullscreen);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('resize', checkOrientationAndFullscreen);
			document.removeEventListener('keydown', handleKeyDown);
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

	if (isLoading) {
		return <div>Loading...</div>;
	}

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
				activeROM={activeROM}
				currentUser={currentUser}
				isSaving={isSaving}
			/>
			<Console
				isEmulatorOn={isEmulatorOn}
				mainCanvasRef={mainCanvasRef}
				mobileZoom={mobileZoom}
			/>
			<FullScreenContainer
				background={fullscreenBackground}
				fullscreenCanvasRef={fullscreenCanvasRef}
				fullscreenContainerRef={fullscreenContainerRef}
				activeROM={activeROM}
				activeState={activeState}
				inGameMemory={inGameMemory}
				MBCRam={mbcRamRef}
				onPauseResume={handlePauseResume}
				intervalPaused={intervalPaused}
			/>
		</div>
	);
}