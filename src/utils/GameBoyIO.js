import GameBoyCore from './GameBoyCore.js';
import {
	intervalPaused,
	findValue,
	setValue,
	deleteValue,
	uploadSaveFile
} from './other/gui.js';
import {
	arrayToBase64,
	base64ToArray,
	base64,
	to_byte,
	to_little_endian_dword
} from './other/base64.js';

var gameboy = null;						//GameBoyCore object.
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
export function start(ROM) {
	clearLastEmulation();
	const gameboy = new GameBoyCore(ROM);
	gameboy.openMBC = openSRAM;
	gameboy.openRTC = openRTC;
	gameboy.start();
	run(gameboy);
}
export function run(gameboyInstance) {
	if (GameBoyEmulatorInitialized(gameboyInstance)) {
		if (!GameBoyEmulatorPlaying(gameboyInstance)) {
			// console.log(gameboyInstance.stopEmulator);
			gameboyInstance.stopEmulator &= 1;
			// console.log(gameboyInstance.stopEmulator);
			console.log("Starting the iterator.", 0);
			var dateObj = new Date();
			gameboyInstance.firstIteration = dateObj.getTime();
			gameboyInstance.iterations = 0;
			gbRunInterval = setInterval(function () {
				if (!document.hidden && !document.msHidden && !document.mozHidden && !document.webkitHidden) {
					gameboyInstance.run();
				}
			}, settings[6]);
		}
		else {
			console.log("The GameBoy core is already running.", 1);
		}
	}
	else {
		console.log("GameBoy core cannot run while it has not been initialized.", 1);
	}
}
export function pause() {
	if (GameBoyEmulatorInitialized()) {
		if (GameBoyEmulatorPlaying()) {
			clearLastEmulation();
			intervalPaused = true;
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
export function save(id, game) {
	var savename;
	if (GameBoyEmulatorInitialized()) {
		savename = id + "_" + game;
		saveState(savename);
	}
	else {
		console.log("GameBoy core cannot be saved while it has not been initialized.", 1);
	}
}
function saveSRAM() {
	if (GameBoyEmulatorInitialized()) {
		if (gameboy.cBATT) {
			try {
				var sram = gameboy.saveSRAMState();
				if (sram.length > 0) {
					console.log("Saving the SRAM...", 0);
					if (findValue("SRAM_" + gameboy.name) !== null) {
						//Remove the outdated storage format save:
						console.log("Deleting the old SRAM save due to outdated format.", 0);
						deleteValue("SRAM_" + gameboy.name);
					}
					setValue("B64_SRAM_" + gameboy.name, arrayToBase64(sram));
				}
				else {
					console.log("SRAM could not be saved because it was empty.", 1);
				}
			}
			catch (error) {
				console.log("Could not save the current emulation state(\"" + error.message + "\").", 2);
			}
		}
		else {
			// console.log("Cannot save a game that does not have battery backed SRAM specified.", 1);
		}
		saveRTC();
	}
	else {
		console.log("GameBoy core cannot be saved while it has not been initialized.", 1);
	}
}
function saveRTC() {	//Execute this when SRAM is being saved as well.
	if (GameBoyEmulatorInitialized()) {
		if (gameboy.cTIMER) {
			try {
				console.log("Saving the RTC...", 0);
				setValue("RTC_" + gameboy.name, gameboy.saveRTCState());
			}
			catch (error) {
				console.log("Could not save the RTC of the current emulation state(\"" + error.message + "\").", 2);
			}
		}
	}
	else {
		console.log("GameBoy core cannot be saved while it has not been initialized.", 1);
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
export function saveState(savename) {
	if (GameBoyEmulatorInitialized()) {
		try {
			uploadSaveFile(gameboy.saveState(), savename = savename);
			console.log("Saved the current state as: " + savename + ".json", 0);
		}
		catch (error) {
			console.log("Could not save the current emulation state(\"" + error.message + "\").", 2);
		}
	}
	else {
		console.log("GameBoy core cannot be saved while it has not been initialized.", 1);
	}
}
export function openState(filename, canvas) {
	try {
		if (findValue(filename) !== null) {
			try {
				clearLastEmulation();
				console.log("Attempting to run a saved emulation state.", 0);

				gameboy = new GameBoyCore(canvas, "");
				gameboy.savedStateFileName = filename;
				gameboy.returnFromState(findValue(filename));
				run();
			}
			catch (error) {
				alert(error.message + " file: " + error.fileName + " line: " + error.lineNumber);
			}
		}
		else {
			console.log("Could not find the save state " + filename + "\".", 2);
		}
	}
	catch (error) {
		console.log("Could not open the saved emulation state.", 2);
	}
}

export function import_save(blobData) {
	blobData = decodeBlob(blobData);

	if (blobData && blobData.blobs) {
		if (blobData.blobs.length > 0) {
			for (var index = 0; index < blobData.blobs.length; ++index) {
				console.log("Importing blob \"" + blobData.blobs[index].blobID + "\"", 0);
				if (blobData.blobs[index].blobContent) {
					if (blobData.blobs[index].blobID.substring(0, 5) === "SRAM_") {
						setValue("B64_" + blobData.blobs[index].blobID, base64(blobData.blobs[index].blobContent));
					}
					else {
						setValue(blobData.blobs[index].blobID, JSON.parse(blobData.blobs[index].blobContent));
					}
				}
				else if (blobData.blobs[index].blobID) {
					console.log("Save file imported had blob \"" + blobData.blobs[index].blobID + "\" with no blob data interpretable.", 2);
				}
				else {
					console.log("Blob chunk information missing completely.", 2);
				}
			}
		}
		else {
			console.log("Could not decode the imported file.", 2);
		}
	}
	else {
		console.log("Could not decode the imported file.", 2);
	}
}

export function generateBlob(keyName, encodedData) {
	//Append the file format prefix:
	var saveString = "EMULATOR_DATA";
	var consoleID = "GameBoy";
	//Figure out the length:
	var totalLength = (saveString.length + 4 + (1 + consoleID.length)) + ((1 + keyName.length) + (4 + encodedData.length));
	//Append the total length in bytes:
	saveString += to_little_endian_dword(totalLength);
	//Append the console ID text's length:
	saveString += to_byte(consoleID.length);
	//Append the console ID text:
	saveString += consoleID;
	//Append the blob ID:
	saveString += to_byte(keyName.length);
	saveString += keyName;
	//Now append the save data:
	saveString += to_little_endian_dword(encodedData.length);
	saveString += encodedData;
	return saveString;
}
export function generateMultiBlob(blobPairs) {
	var consoleID = "GameBoy";
	//Figure out the initial length:
	var totalLength = 13 + 4 + 1 + consoleID.length;
	//Append the console ID text's length:
	var saveString = to_byte(consoleID.length);
	//Append the console ID text:
	saveString += consoleID;
	var keyName = "";
	var encodedData = "";
	//Now append all the blobs:
	for (var index = 0; index < blobPairs.length; ++index) {
		keyName = blobPairs[index][0];
		encodedData = blobPairs[index][1];
		//Append the blob ID:
		saveString += to_byte(keyName.length);
		saveString += keyName;
		//Now append the save data:
		saveString += to_little_endian_dword(encodedData.length);
		saveString += encodedData;
		//Update the total length:
		totalLength += 1 + keyName.length + 4 + encodedData.length;
	}
	//Now add the prefix:
	saveString = "EMULATOR_DATA" + to_little_endian_dword(totalLength) + saveString;
	return saveString;
}
function decodeBlob(blobData) {
	/*Format is as follows:
		- 13 byte string "EMULATOR_DATA"
		- 4 byte total size (including these 4 bytes).
		- 1 byte Console type ID length
		- Console type ID text of 8 bit size
		blobs {
			- 1 byte blob ID length
			- blob ID text (Used to say what the data is (SRAM/freeze state/etc...))
			- 4 byte blob length
			- blob length of 32 bit size
		}
	*/
	var length = blobData.length;
	var blobProperties = {};
	blobProperties.consoleID = null;
	var blobsCount = -1;
	blobProperties.blobs = [];
	if (length > 17) {
		if (blobData.substring(0, 13) === "EMULATOR_DATA") {
			var length = Math.min(((blobData.charCodeAt(16) & 0xFF) << 24) | ((blobData.charCodeAt(15) & 0xFF) << 16) | ((blobData.charCodeAt(14) & 0xFF) << 8) | (blobData.charCodeAt(13) & 0xFF), length);
			var consoleIDLength = blobData.charCodeAt(17) & 0xFF;
			if (length > 17 + consoleIDLength) {
				blobProperties.consoleID = blobData.substring(18, 18 + consoleIDLength);
				var blobIDLength = 0;
				var blobLength = 0;
				for (var index = 18 + consoleIDLength; index < length;) {
					blobIDLength = blobData.charCodeAt(index++) & 0xFF;
					if (index + blobIDLength < length) {
						blobProperties.blobs[++blobsCount] = {};
						blobProperties.blobs[blobsCount].blobID = blobData.substring(index, index + blobIDLength);
						index += blobIDLength;
						if (index + 4 < length) {
							blobLength = ((blobData.charCodeAt(index + 3) & 0xFF) << 24) | ((blobData.charCodeAt(index + 2) & 0xFF) << 16) | ((blobData.charCodeAt(index + 1) & 0xFF) << 8) | (blobData.charCodeAt(index) & 0xFF);
							index += 4;
							if (index + blobLength <= length) {
								blobProperties.blobs[blobsCount].blobContent = blobData.substring(index, index + blobLength);
								index += blobLength;
							}
							else {
								console.log("Blob length check failed, blob determined to be incomplete.", 2);
								break;
							}
						}
						else {
							console.log("Blob was incomplete, bailing out.", 2);
							break;
						}
					}
					else {
						console.log("Blob was incomplete, bailing out.", 2);
						break;
					}
				}
			}
		}
	}
	return blobProperties;
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