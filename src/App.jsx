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
	const mainCanvas = document.getElementById('mainCanvas');
	const fullscreenContainer = document.getElementById('fullscreenContainer');
	const fullscreenCanvas = document.getElementById('fullscreen');

	const [ROMImage, setROMImage] = useState(null);
	const [speed, setSpeed] = useState(1);
	const gameBoyInstance = useRef(null);
	const runInterval = useRef(null);
	const [isSoundOn, setIsSoundOn] = useState(settings[0]); // Initialize the state based on settings
	const [intervalPaused, setIntervalPaused] = useState(false);
	const [isEmulatorPlaying, setIsEmulatorPlaying] = useState(false);
	const [isEmulatorOn, setIsEmulatorOn] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [fullscreenBackground, setFullscreenBackground] = useState('');

	// Modified run function to use the runInterval ref
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
	const handleROMSelected = (selectedROM) => {
		// Find the option element that matches the selected ROM
		const romOption = document.querySelector(`option[value='${selectedROM}']`);

		// Get the data-background attribute from the option element and update the background
		const background = romOption.getAttribute('data-background');
		updateBackgroundForFullscreen(background);

		// Remaining logic to handle ROM file fetching and setting up FileReader
		const splitFilename = selectedROM.split('/');
		const filename = splitFilename[splitFilename.length - 1];
		fetch(selectedROM)
			.then(res => res.blob()) // Get the blob from the response
			.then(blob => {
				// Create a File object from the Blob
				const myFile = new File([blob], filename, {
					type: blob.type
				});

				// Instantiate FileReader and set up its event listener
				var reader = new FileReader();
				reader.addEventListener('load', function (p) {
					// Update ROMImage state and let useEffect handle the rest
					setROMImage(p.target.result);
				});

				// Read the binary data from the file
				reader.readAsBinaryString(myFile);
			});
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
			mainCanvas.style.opacity = 0;
			fullscreenCanvas.style.opacity = 0;
			clearInterval(runInterval.current);
			setIsEmulatorPlaying(false);
			setIntervalPaused(false);
		} else {
			// Logic to initialize and start the emulator using the ROMImage from state
			if (gameBoyInstance.current) {
				mainCanvas.style.opacity = 1;
				fullscreenCanvas.style.opacity = 1;
				console.log("Starting GameBoyCore instance...");
				if (isFullscreen) {
					gameBoyInstance.current = new GameBoyCore(ROMImage, fullscreenCanvas);
				} else {
					gameBoyInstance.current = new GameBoyCore(ROMImage, mainCanvas);
				}
				gameBoyInstance.current.start();
				console.log("Calling run() function...");
				run(gameBoyInstance.current);
				setIsEmulatorPlaying(true);
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
			clearInterval(runInterval.current);
			console.log("Resetting GameBoy with the same ROM...");
			clearLastEmulation(gameBoyInstance.current, runInterval);
			if (isFullscreen) {
				gameBoyInstance.current = new GameBoyCore(ROMImage, fullscreenCanvas);
			} else {
				gameBoyInstance.current = new GameBoyCore(ROMImage, mainCanvas);
			}
			gameBoyInstance.current.start();
			run(gameBoyInstance.current);
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
				fullscreenContainer.style.display = "flex";
				try {
					gameBoyInstance.current.canvas = fullscreenCanvas;
				} catch {

				}
			} else {
				fullscreenContainer.style.display = "none";
				try {
					gameBoyInstance.current.canvas = mainCanvas;
				} catch {

				}
			}
		} else {
			fullscreenContainer.style.display = "none";
			try {
				gameBoyInstance.current.canvas = mainCanvas;
			} catch {

			}
		}
		try {
			gameBoyInstance.current.initLCD();
		} catch {

		}
		setIsFullscreen(!isFullscreen);
	},
		[isFullscreen, gameBoyInstance, fullscreenCanvas, mainCanvas]
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
				if (isFullscreen) {
					gameBoyInstance.current = new GameBoyCore(ROMImage, fullscreenCanvas);
				} else {
					gameBoyInstance.current = new GameBoyCore(ROMImage, mainCanvas);
				}
				console.log("GameBoyCore instance created. Waiting for start command.");
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
		[ROMImage, isFullscreen, fullscreenCanvas, mainCanvas]
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
			try {
				const context = mainCanvas.getContext('2d');
				context.clearRect(0, 0, mainCanvas.width, mainCanvas.height); // Clear the canvas
				mainCanvas.style.visibility = 'hidden';
			} catch (err) {

			}
			try {
				const fsContext = fullscreenCanvas.getContext('2d');
				fsContext.clearRect(0, 0, fullscreenCanvas.width, fullscreenCanvas.height);
				fullscreenCanvas.style.visibility = 'hidden';
			} catch (err) {

			}
		}
	},
		[isEmulatorOn, fullscreenCanvas, mainCanvas]
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
				/>
			</div>
			<Console
				isEmulatorOn={isEmulatorOn}
			/>
			<FullScreenContainer background={fullscreenBackground} />
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