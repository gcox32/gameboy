import React, { useState, useRef, useEffect } from 'react';
import Console from './components/console/GameConsole';
import Cartridges from './components/Cartridges';
import SystemControls from './components/SystemControls';
import FullScreenContainer from './components/FullScreenContainer';
import GameDisplay from './components/console/GameDisplay';
import GameBoyCore from './utils/GameBoyCore';
import { DEBUG_MESSAGES, DEBUG_WINDOWING } from './utils/config';
import { windowStacks } from './utils/other/windowStack';
import {
	inFullscreen,
	mainCanvas,
	fullscreenCanvas,
	showAsMinimal,
	intervalPaused,
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
	const [ROMImage, setROMImage] = useState(null);
	const [speed, setSpeed] = useState(1);
	const gameBoyInstance = useRef(null);
	const runInterval = useRef(null);
	const [isSoundOn, setIsSoundOn] = useState(settings[0]); // Initialize the state based on settings

	// Modified run function to use the runInterval ref
	const run = (gameboyInstance) => {
		if (GameBoyEmulatorInitialized(gameboyInstance)) {
			if (!GameBoyEmulatorPlaying(gameboyInstance)) {
				gameboyInstance.stopEmulator &= 1;
				console.log("Starting the iterator.");
				var dateObj = new Date();
				gameboyInstance.firstIteration = dateObj.getTime();
				gameboyInstance.iterations = 0;
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

	// Initialize gameBoyInstance with the first ROMImage on component mount
	useEffect(() => {
		if (ROMImage) {
			try {
				console.log("Clearing previous emulation...");
				clearLastEmulation(gameBoyInstance.current, runInterval);

				console.log("Creating new GameBoyCore instance...");
				gameBoyInstance.current = new GameBoyCore(ROMImage);

				console.log("Starting GameBoyCore instance...");
				gameBoyInstance.current.start();

				console.log("Calling run() function...");
				run(gameBoyInstance.current);

				console.log("Initialization completed. GameBoy instance:", gameBoyInstance.current);
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
	}, [ROMImage]);

	// Handler for ROM selection
	const handleROMSelected = (selectedROM) => {
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

	const keyDownHandler = (event) => {
		//   console.log("Current GameBoy instance:", gameBoyInstance.current);
		if (gameBoyInstance.current) {
			keyDown(event, gameBoyInstance.current);
			// keyUp(event, gameBoyInstance.current);
		} else {
			// console.error("GameBoy instance is not initialized.");
		}
	};
	const keyUpHandler = (event) => {
		console.log('key up triggered');
		if (gameBoyInstance.current) {
			keyUp(event, gameBoyInstance.current);
			// keyUp(event, gameBoyInstance.current);
		} else {
			// console.error("GameBoy instance is not initialized.");
		}
	}

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
	}, []);

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
	const fullscreenPlayer = () => {
		if (GameBoyEmulatorInitialized()) {
			if (!inFullscreen) {
				gameBoyInstance.canvas = fullscreenCanvas;
				fullscreenCanvas.className = (showAsMinimal) ? "minimum" : "maximum";
				document.getElementById("fullscreenContainer").style.display = "block";
				windowStacks[0].hide();
			}
			else {
				gameBoyInstance.canvas = mainCanvas;
				document.getElementById("fullscreenContainer").style.display = "none";
				windowStacks[0].show();
			}
			gameBoyInstance.initLCD();
			inFullscreen = !inFullscreen;
		}
		else {
			console.log("Cannot go into fullscreen mode.", 2);
		}
	};
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
		if (GameBoyEmulatorInitialized() && gameBoyInstance.current) {
			gameBoyInstance.current.initSound(); // Call initSound on the gameBoyInstance
		}
	};

	return (
		<div className="App">
			<Cartridges onROMSelected={handleROMSelected} />
			<SystemControls
				gameBoy={gameBoyInstance}
				speed={speed}
				initSound={initSound}
				onSpeedChange={handleSpeedChange}
				isSoundOn={isSoundOn} // Pass the state to SystemControls
			/>
			<Console ROMImage={ROMImage} />
			<FullScreenContainer />
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