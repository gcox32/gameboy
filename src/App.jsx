import React, { useState, useRef, useEffect, useCallback } from 'react';
import Console from './components/console/GameConsole';
import Cartridges from './components/Cartridges';
import SystemControls from './components/SystemControls';
import FullScreenContainer from './components/FullScreenContainer';
import GameBoyCore from './utils/GameBoyCore';
import {
	registerGUIEvents,
	keyDown,
	keyUp
} from './utils/other/gui';
import {
	GameBoyEmulatorInitialized,
	GameBoyEmulatorPlaying,
	settings,
	clearLastEmulation
} from './utils/GameBoyIO';
import { saveSRAM, fetchUserSaveStates } from './utils/saveLoad';

// styles
import './styles/styles.css';
import './styles/modal.css';
// Amplify auth
import { Amplify, Auth } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import awsconfig from './aws-exports';
// auth components
import { Footer } from "./components/auth/Footer";
import { SignInHeader } from "./components/auth/SignInHeader";
import { SignInFooter } from "./components/auth/SignInFooter";

Amplify.configure(awsconfig);

function App() {
	// Refs to access the DOM elements
	const gameBoyInstance = useRef(null);
	const runInterval = useRef(null);
	const mainCanvasRef = useRef(null);
	const fullscreenCanvasRef = useRef(null);
	const fullscreenContainerRef = useRef(null);

	// Maintain states
	const [currentUser, setUser] = useState([]);
	const [ROMImage, setROMImage] = useState(null);
	const [activeROM, setActiveROM] = useState(null);
	const [userSaveStates, setUserSaveStates] = useState([])
	const [activeState, setActiveState] = useState(null);
	const [isRomLoaded, setIsRomLoaded] = useState(false);
	const [speed, setSpeed] = useState(1);
	const [isSoundOn, setIsSoundOn] = useState(settings[0]);
	const [intervalPaused, setIntervalPaused] = useState(false);
	const [isEmulatorPlaying, setIsEmulatorPlaying] = useState(false);
	const [isEmulatorOn, setIsEmulatorOn] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [fullscreenBackground, setFullscreenBackground] = useState('');

	const run = (gameboyInstance) => {
		setIntervalPaused(false);
		if (GameBoyEmulatorInitialized(gameboyInstance)) {
			if (!GameBoyEmulatorPlaying(gameboyInstance)) {
				gameboyInstance.stopEmulator &= 1;
				console.log("Starting the iterator.");
				console.log(gameboyInstance);
				var dateObj = new Date();
				gameboyInstance.firstIteration = dateObj.getTime();
				gameboyInstance.iterations = 0;
				console.log(gameboyInstance.numRAMBanks);
				gameBoyInstance.current.setSpeed(speed);
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
			setUserSaveStates(await fetchUserSaveStates(currentUser.sub, selectedROM.id))
			updateBackgroundForFullscreen(selectedROM.backgroundImg);
			const romUrl = `https://assets.letmedemo.com/public/gameboy/games/${selectedROM.filePath}`;
			console.log('Current user:', currentUser);
			try {
				const response = await fetch(romUrl);
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const blob = await response.blob();
				const reader = new FileReader();
				reader.onloadend = () => {
					// Assuming setROMImage expects a binary string
					setROMImage(reader.result);
					setIsRomLoaded(true); // Set the flag indicating the ROM is loaded
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
			// Handle the scenario when no ROM is selected or the selectedROM is not provided
			setROMImage(null);
			setIsRomLoaded(false);
		}
	};
	const updateBackgroundForFullscreen = (backgroundData) => {
		// Update the fullscreen background state
		if (backgroundData) {
			const backgroundUrl = `https://assets.letmedemo.com/public/gameboy/images/fullscreen/${backgroundData}`;
			setFullscreenBackground(backgroundUrl);
		} else {
			setFullscreenBackground(''); // Reset to default if no ROM is selected or if it doesn't have a background
		}
	};
	const handlePowerToggle = () => {
		if (gameBoyInstance.current && (isEmulatorPlaying || intervalPaused)) {
			console.log("Turning off the emulator...");
			// clearLastEmulation(gameBoyInstance.current, runInterval);
			mainCanvasRef.current.style.opacity = 0;
			fullscreenCanvasRef.current.style.opacity = 0;
			clearInterval(runInterval.current);
			setIsEmulatorPlaying(false);
			setIntervalPaused(false);
			setIsRomLoaded(true);
		} else {
			// Logic to initialize and start the emulator using the ROMImage from state
			if (gameBoyInstance.current && ROMImage) {
				console.log("Starting GameBoyCore instance...");
				console.log(gameBoyInstance.current);
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
	const handleSpeedChange = (e) => {
		const newSpeed = e.target.value;
		if (GameBoyEmulatorInitialized(gameBoyInstance.current)) {
			if (newSpeed !== null && newSpeed.length > 0) {
				const parsedSpeed = Math.max(parseFloat(newSpeed), 0.001);
				gameBoyInstance.current.setSpeed(parsedSpeed);
				setSpeed(parsedSpeed); // Update the speed state
			}
		}
	};
	const handleReset = () => {
		if (ROMImage) {
			console.log("Resetting GameBoy with the same ROM...");
			clearInterval(runInterval.current);
			setIsEmulatorPlaying(false);
			setIntervalPaused(false);

			// The canvas to use is now decided by the state, and not by direct DOM access.
			const currentCanvas = isFullscreen ? fullscreenCanvasRef.current : mainCanvasRef.current;

			if (currentCanvas) {
				if (activeState) {
					gameBoyInstance.current = new GameBoyCore(ROMImage, currentCanvas, activeState);
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
				// console.log(gameBoyInstance.current.MBCRam);
				clearLastEmulation(gameBoyInstance.current, runInterval);
				setIntervalPaused(true);  // Pause the game
			} else {
				console.log("Resuming...");
				// Ensure to clear any previous intervals before starting a new one
				if (runInterval.current) {
					clearInterval(runInterval.current);
				}
				run(gameBoyInstance.current);  // Start the run loop again
				setIntervalPaused(false);  // Update state to indicate the game is no longer paused
			}
		} else {
			console.log("GameBoy core cannot be paused/resumed while it has not been initialized.", 1);
		}
	};
	const toggleFullscreenMode = useCallback(() => {
		// Only allow fullscreen if the emulator is on and the screen width is greater than its height
		if (window.innerWidth > window.innerHeight) {
			if (!isFullscreen) {
				fullscreenContainerRef.current.style.display = "flex";
				if (gameBoyInstance.current && fullscreenCanvasRef.current) {
					gameBoyInstance.current.canvas = fullscreenCanvasRef.current;
				}
			} else {
				fullscreenContainerRef.current.style.display = "none";
				if (gameBoyInstance.current && mainCanvasRef.current) {
					gameBoyInstance.current.canvas = mainCanvasRef.current;
				}
			}
		} else {
			fullscreenContainerRef.current.style.display = "none";
			if (gameBoyInstance.current && mainCanvasRef.current) {
				gameBoyInstance.current.canvas = mainCanvasRef.current;
			}
		}
		if (gameBoyInstance.current) {
			gameBoyInstance.current.initLCD();
		}
		setIsFullscreen(!isFullscreen);
	},
		[isFullscreen, gameBoyInstance]
	);
	const initSound = () => {
		if (isSoundOn) {
			// Code to turn off sound
			console.log(gameBoyInstance.current.saveRTCState());
			settings[0] = false;
			setIsSoundOn(false); // Update state
		} else {
			// Code to turn on sound
			settings[0] = true;
			setIsSoundOn(true); // Update state
		}
		if (GameBoyEmulatorInitialized(gameBoyInstance.current) && gameBoyInstance.current) {
			gameBoyInstance.current.initSound();
		}
	};
	const onSaveConfirmed = async (saveModalData, previous = false) => {
		saveModalData.owner = currentUser.sub;
		if (previous && activeState) {
			saveModalData.id = activeState.id;
			saveModalData.filePath = activeState.filePath;
		}
		if (gameBoyInstance.current && activeROM && isEmulatorPlaying) {
			try {
				const savedState = await saveSRAM(gameBoyInstance.current, activeROM, saveModalData, previous);
				setActiveState(savedState); // ddb id of active game state
				console.log('saved successfully');
				const userSaves = await fetchUserSaveStates(currentUser.sub, activeROM.id);
				setUserSaveStates(userSaves);
			} catch (error) {
				console.log(error);
			}
		}
	};
	const runFromSaveState = (sramArray) => {
		console.log('Initiating state from load...');
		const currentCanvas = isFullscreen ? fullscreenCanvasRef.current : mainCanvasRef.current;
		mainCanvasRef.current.style.opacity = 1;
		fullscreenCanvasRef.current.style.opacity = 1;
		gameBoyInstance.current = new GameBoyCore(ROMImage, currentCanvas, sramArray);
		gameBoyInstance.current.start();
		run(gameBoyInstance.current);
		setIsEmulatorPlaying(true);
		setActiveState(sramArray);
	};

	// Maintain authenticated user information
	useEffect(() => {
		const loadUser = () => {
			return Auth.currentAuthenticatedUser({ bypassCache: true });
		}
		const onLoad = async () => {
			try {
				const user = await loadUser();
				setUser(user.attributes);
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
		[intervalPaused]
	);
	// Initialize gameBoyInstance with the first ROMImage on component mount
	useEffect(() => {
		if (ROMImage) {
			console.log('effect triggered');
			try {
				console.log("Clearing previous emulation...");
				clearLastEmulation(gameBoyInstance.current, runInterval);

				console.log("Creating new GameBoyCore instance...");
				const currentCanvas = isFullscreen ? fullscreenCanvasRef.current : mainCanvasRef.current;

				if (currentCanvas) {
					gameBoyInstance.current = new GameBoyCore(ROMImage, currentCanvas);
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
	},
		[ROMImage, isRomLoaded]
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

	return (
		<div className="App">
			<div id="control-panel">
				<Cartridges
					onROMSelected={handleROMSelected}
					isDisabled={isEmulatorPlaying}
				/>
				<SystemControls
					intervalPaused={intervalPaused}
					onPauseResume={handlePauseResume}
					onReset={handleReset}
					isSoundOn={isSoundOn}
					initSound={initSound}
					speed={speed}
					onSpeedChange={handleSpeedChange}
					isEmulatorPlaying={isEmulatorPlaying}
					onPowerToggle={handlePowerToggle}
					onFullscreenToggle={toggleFullscreenMode}
					isRomLoaded={isRomLoaded}
					onSaveConfirmed={onSaveConfirmed}
					userSaveStates={userSaveStates}
					runFromSaveState={runFromSaveState}
					currentROM={activeROM}
				/>
			</div>
			<Console
				isEmulatorOn={isEmulatorOn}
				mainCanvasRef={mainCanvasRef}
			/>
			<FullScreenContainer
				background={fullscreenBackground}
				fullscreenCanvasRef={fullscreenCanvasRef}
				fullscreenContainerRef={fullscreenContainerRef}
			/>
		</div>
	);
}

export default withAuthenticator(App, {
	components: {
		// Header,
		SignIn: {
			Header: SignInHeader,
			Footer: SignInFooter
		},
		Footer
	},
	hideSignUp: true
});