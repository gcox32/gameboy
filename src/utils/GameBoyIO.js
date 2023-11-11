import {
	findValue
} from './other/gui.js';
import { base64ToArray } from './other/base64.js';

export var gbRunInterval = null;				//GameBoyCore Timer
export var settings = [						//Some settings.
	true, 								//Turn on sound.
	true,								//Boot with boot ROM first?
	false,								//Give priority to GameBoy mode
	1,									//Volume level set.
	true,								//Colorize GB mode?
	false,								//Disallow typed arrays?
	8,									//Interval for the emulator loop.
	10,									//Audio buffer minimum span amount over x interpreter iterations.
	20,									//Audio buffer maximum span amount over x interpreter iterations.
	false,								//Override to allow for MBC1 instead of ROM only (compatibility for broken 3rd-party cartridges).
	false,								//Override MBC RAM disabling and always allow reading and writing to the banks.
	false,								//Use the GameBoy boot ROM instead of the GameBoy Color boot ROM.
	false,								//Scale the canvas in JS, or let the browser scale the canvas?
	true,								//Use image smoothing based scaling?
	[true, true, true, true]            //User controlled channel enables.
];
export function pause() {
	if (GameBoyEmulatorInitialized()) {
		if (GameBoyEmulatorPlaying()) {
			clearLastEmulation();
		}
		else {
			console.log("GameBoy core has already been paused.", 1);
		}
	}
	else {
		console.log("GameBoy core cannot be paused while it has not been initialized.", 1);
	}
}
export function clearLastEmulation(gameboyInstance, gbRunInterval) {
	if (GameBoyEmulatorInitialized(gameboyInstance) && GameBoyEmulatorPlaying(gameboyInstance)) {
		clearInterval(gbRunInterval);
		gameboyInstance.stopEmulator |= 2;
		console.log("The previous emulation has been cleared.", 0);
	}
	else {
		console.log("No previous emulation was found to be cleared.", 0);
	}
}
export function openSRAM(filename) {
	try {
		if (findValue("B64_SRAM_" + filename) !== null) {
			console.log(filename); // POKEMON BLU, POKEMON YEL, POKEMON RED
			console.log("Found a previous SRAM state (Will attempt to load).", 0);
			return base64ToArray(findValue("B64_SRAM_" + filename));
		}
		else if (findValue("SRAM_" + filename) !== null) {
			console.log("Found a previous SRAM state (Will attempt to load).", 0);
			return findValue("SRAM_" + filename);
		}
		else {
			console.log("Could not find any previous SRAM copy for the current ROM.", 0);
		}
	}
	catch (error) {
		console.log("Could not open the  SRAM of the saved emulation state.", 2);
	}
	return [];
}
export function openRTC(filename) {
	try {
		if (findValue("RTC_" + filename) !== null) {
			console.log("Found a previous RTC state (Will attempt to load).", 0);
			return findValue("RTC_" + filename);
		}
		else {
			console.log("Could not find any previous RTC copy for the current ROM.", 0);
		}
	}
	catch (error) {
		console.log("Could not open the RTC data of the saved emulation state.", 2);
	}
	return [];
}
function matchKey(key) {	//Maps a keyboard key to a gameboy key.
	//Order: Right, Left, Up, Down, A, B, Select, Start
	var keymap = ["right", "left", "up", "down", "a", "b", "select", "start"];	//Keyboard button map.
	for (var index = 0; index < keymap.length; index++) {
		if (keymap[index] === key) {
			return index;
		}
	}
	return -1;
}
export function GameBoyEmulatorInitialized(gameboyInstance) {
	return (typeof gameboyInstance === "object" && gameboyInstance !== null);
}
export function GameBoyEmulatorPlaying(gameboyInstance) {
	return ((gameboyInstance.stopEmulator & 2) === 0);
}
export function GameBoyKeyDown(key, gameboyInstance) {
	if (GameBoyEmulatorInitialized(gameboyInstance) && GameBoyEmulatorPlaying(gameboyInstance)) {
		GameBoyJoyPadEvent(gameboyInstance, matchKey(key), true);
	}
}
export function GameBoyKeyUp(key, gameboyInstance) {
	if (GameBoyEmulatorInitialized(gameboyInstance) && GameBoyEmulatorPlaying(gameboyInstance)) {
		GameBoyJoyPadEvent(gameboyInstance, matchKey(key), false);
	}
}
export function GameBoyJoyPadEvent(gameboyInstance, keycode, down) {
	if (GameBoyEmulatorInitialized(gameboyInstance) && GameBoyEmulatorPlaying(gameboyInstance)) {
		if (keycode >= 0 && keycode < 8) {
			gameboyInstance.JoyPadEvent(keycode, down);
		}
	}
}
export function GameBoyGyroSignalHandler(e, gameboyInstance) {
	if (GameBoyEmulatorInitialized(gameboyInstance) && GameBoyEmulatorPlaying(gameboyInstance)) {
		if (e.gamma || e.beta) {
			gameboyInstance.GyroEvent(e.gamma * Math.PI / 180, e.beta * Math.PI / 180);
		}
		else {
			gameboyInstance.GyroEvent(e.x, e.y);
		}
		try {
			e.preventDefault();
		}
		catch (error) { }
	}
}
//The emulator will call this to sort out the canvas properties for (re)initialization.
export function initNewCanvas(gameboyInstance) {
	if (GameBoyEmulatorInitialized()) {
		gameboyInstance.canvas.width = gameboyInstance.canvas.clientWidth;
		gameboyInstance.canvas.height = gameboyInstance.canvas.clientHeight;
	}
}
//Call this when resizing the canvas:
export function initNewCanvasSize(gameboyInstance) {
	if (GameBoyEmulatorInitialized(gameboyInstance) && gameboyInstance !== null) {
		if (!settings[12]) {
			if (gameboyInstance.onscreenWidth !== 160 || gameboyInstance.onscreenHeight !== 144) {
				try {
					gameboyInstance.initLCD();
				} catch {
					// console.log('')
				}
			}
		}
		else {
			if (gameboyInstance.onscreenWidth !== gameboyInstance.canvas.clientWidth || gameboyInstance.onscreenHeight !== gameboyInstance.canvas.clientHeight) {
				try {
					gameboyInstance.initLCD();
				} catch {
					// console.log('')
				}
			}
		}
	}
}
