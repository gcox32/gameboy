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

// styles
import logo from './logo.svg';
import './styles/styles.css';
import './styles/modal.css';
// Amplify auth
import { Amplify } from 'aws-amplify';
import { withAuthenticator, Authenticator } from '@aws-amplify/ui-react';
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
	const [ROMImage, setROMImage] = useState(null);
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
				var dateObj = new Date();
				gameboyInstance.firstIteration = dateObj.getTime();
				gameboyInstance.iterations = 0;
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
			setIsRomLoaded(false);
			updateBackgroundForFullscreen(selectedROM.background);
			const romUrl = `https://assets.letmedemo.com/gameboy/games/carts/${selectedROM.value}`;

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
			const backgroundUrl = `https://assets.letmedemo.com/gameboy/images/fullscreen/${backgroundData}`;
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
		} else {
			// Logic to initialize and start the emulator using the ROMImage from state
			if (gameBoyInstance.current && ROMImage) {
				console.log("Starting GameBoyCore instance...");
				const canvas = isFullscreen ? fullscreenCanvasRef.current : mainCanvasRef.current;
				if (canvas) {
					mainCanvasRef.current.style.opacity = 1;
					fullscreenCanvasRef.current.style.opacity = 1;
					gameBoyInstance.current = new GameBoyCore(ROMImage, canvas);
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
		if (gameBoyInstance.current) {
			keyDown(event, gameBoyInstance.current);
		} else {
			// console.error("GameBoy instance is not initialized.");
		}
	};
	const keyUpHandler = (event) => {
		if (gameBoyInstance.current) {
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
				gameBoyInstance.current = new GameBoyCore(ROMImage, currentCanvas);
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
				console.log("Pausing GameBoy...");
				clearLastEmulation(gameBoyInstance.current, runInterval);
				setIntervalPaused(true);  // Pause the game
			} else {
				console.log("Resuming GameBoy...");
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
			console.log('initLCD');
			gameBoyInstance.current.initLCD();
		}
		setIsFullscreen(!isFullscreen);
	},
		[isFullscreen, gameBoyInstance]
	);
	const initSound = () => {
		if (isSoundOn) {
			// Code to turn off sound
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
		[]
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
		// Dependencies list should include the state that triggers re-creation of the instance
		[ROMImage]
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
			<div id="system-controls">
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
			<header
				className="App-header"
			// style={{display:'none'}}
			>
				<Authenticator >
					{({ signOut }) => (
						// eslint-disable-next-line
						<a className="hover-pointer" href="#" onClick={signOut}>
							<img src={logo} className="App-logo" alt="logo" />
						</a>
					)}
				</Authenticator>
			</header>
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