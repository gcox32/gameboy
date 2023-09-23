var inFullscreen = false;
var mainCanvas = null;
var fullscreenCanvas = null;
var showAsMinimal = false;
var intervalPaused = false;
var keyZones = [
	["right", [39]],
	["left", [37]],
	["up", [38]],
	["down", [40]],
	["a", [88, 74]],
	["b", [90, 81, 89]],
	["select", [16]],
	["start", [13]]
];
var gameList = [
	'blue.gbc', 'yellow.gbc', 'red.gbc', 'green.gb'
]


function windowingInitialize() {
	console.log("windowingInitialize() called.", 0);
	windowStacks[0] = windowCreate("GameBoy", true);
	mainCanvas = document.getElementById("mainCanvas");
	fullscreenCanvas = document.getElementById("fullscreen");

	try {
		//Hook the GUI controls.
		registerGUIEvents();
	}
	catch (error) {
		console.log("Fatal windowing error: \"" + error.message + "\" file:" + error.fileName + " line: " + error.lineNumber, 2);
	}
	//Update the settings to the emulator's default:
	document.getElementById("enable-sound").checked = settings[0];
}
function registerGUIEvents() {
	console.log("In registerGUIEvents() : Registering GUI Events.", -1);
	addEvent("click", document.getElementById("blue"), function() {
		var [gameFile, game, clickedCode, saveFileLoc] = getVars(0);
		loadSavedorNewGame(clickedCode, game, gameFile, saveFileLoc);
	});
	addEvent("click", document.getElementById("yellow"), function() {
		var [gameFile, game, clickedCode, saveFileLoc] = getVars(1);
		loadSavedorNewGame(clickedCode, game, gameFile, saveFileLoc);
	});
	addEvent("click", document.getElementById("red"), function() {
		var [gameFile, game, clickedCode, saveFileLoc] = getVars(2);
		loadSavedorNewGame(clickedCode, game, gameFile, saveFileLoc);
	});
	addEvent("click", document.getElementById("green"), function() {
		var [gameFile, game, clickedCode, saveFileLoc] = getVars(3);
		loadSavedorNewGame(clickedCode, game, gameFile, saveFileLoc);
	});
// 
	addEvent("click", document.getElementById("saver"), function() {
		var id = document.getElementById("current-user").textContent;
		var game = document.getElementById("active-cart").textContent;
		var saver = document.getElementById("saver");
		saver.style.background = 'rgba(153, 153, 153, 1)';
		saver.innerText = 'saving...'
		save(id=id, game=game);
	});

	addEvent("click", document.getElementById("pause-btn"), function () {
		pauseBtn = document.getElementById("pause-btn");
		if(pauseBtn.dataset.paused === 'pause') {
			pause();
			pauseBtn.dataset.paused = 'resume';
			pauseBtn.innerHTML = "<img src='/static/images/play_icon.png' height='48' name='resume-btn-img' />";
		} else {
			run();
			pauseBtn.dataset.paused = 'pause';
			pauseBtn.innerHTML = "<img src='/static/images/pause_icon.png' />";
		}
	});

	addEvent("click", document.getElementById("reset-btn"), function () {
		var activeCart = document.getElementById('active-cart').textContent;
		var idx;
		switch(activeCart) {
			case "blue":idx=0;break;
			case "yellow":idx=1;break;
			case "red":idx=2;break;
			case "green":idx=3;break;
		};
		var [gameFile, game, clickedCode, saveFileLoc] = getVars(idx);
		loadSavedorNewGame(clickedCode, game, gameFile, saveFileLoc);
	})
	addEvent("click", document.getElementById("newgame-btn"), function () {
		if (GameBoyEmulatorInitialized()) {
			var activeCart = document.getElementById('active-cart').textContent;
			var idx;
			switch(activeCart) {
				case "blue":idx=0;break;
				case "yellow":idx=1;break;
				case "red":idx=2;break;
				case "green":idx=3;break;
			};
			newCart = gameList[idx]
			clearParty();
			loadNewGameFunc(newCart);
		}
	});
	// addEvent("click", document.getElementById("refresh-party"), function () {
	// 	var game = document.getElementById("active-cart").textContent;
	// 	clearInterval(updateInterval);
	// 	updateParty(gameboy.saveState(), 'gif', game);
	// })
	// addEvent("mousedown", document.getElementById("refresh-party"), function() {
	// 	document.getElementById("refresh-icon").setAttribute("src", "/staticfiles/genone/images/icons/refresh.gif");
	// })
	// addEvent("mouseup", document.getElementById("refresh-party"), function() {
	// 	document.getElementById("refresh-icon").setAttribute("src", "/staticfiles/genone/images/icons/refresh.png");
	// })
	addEvent("change", document.getElementById("speed-input"), function () {
		if (GameBoyEmulatorInitialized()) {
			var speed = document.getElementById("speed-input").value;
			if (speed != null && speed.length > 0) {
				gameboy.setSpeed(Math.max(parseFloat(speed), 0.001));
			}
		}
	})

	// clickable joypad
	addEvent('mousedown', document.getElementById('a-btn'), function(keyEvent) {
		interval = setInterval(clickBtn(keyEvent, 88), 10);
	});
	addEvent('mouseup', document.getElementById('a-btn'), function() {
		releaseBtn(keyEvent, 88);
		clearInterval(interval);
	});
	addEvent('mousedown', document.getElementById('b-btn'), function(keyEvent) {
		interval = setInterval(clickBtn(keyEvent, 90), 10);
	});
	addEvent('mouseup', document.getElementById('b-btn'), function() {
		releaseBtn(keyEvent, 90);
		clearInterval(interval);
	});
	addEvent('mousedown', document.getElementById('up-btn'), function(keyEvent) {
		interval = setInterval(clickBtn(keyEvent, 38), 10);
	});
	addEvent('mouseup', document.getElementById('up-btn'), function() {
		releaseBtn(keyEvent, 38);
		clearInterval(interval);
	});
	addEvent('mousedown', document.getElementById('down-btn'), function(keyEvent) {
		interval = setInterval(clickBtn(keyEvent, 40), 10);
	});
	addEvent('mouseup', document.getElementById('down-btn'), function() {
		releaseBtn(keyEvent, 40);
		clearInterval(interval);
	});
	addEvent('mousedown', document.getElementById('left-btn'), function(keyEvent) {
		interval = setInterval(clickBtn(keyEvent, 37), 10);
	});
	addEvent('mouseup', document.getElementById('left-btn'), function() {
		releaseBtn(keyEvent, 37);
		clearInterval(interval);
	});
	addEvent('mousedown', document.getElementById('right-btn'), function(keyEvent) {
		interval = setInterval(clickBtn(keyEvent, 39), 10);
	});
	addEvent('mouseup', document.getElementById('right-btn'), function() {
		releaseBtn(keyEvent, 39);
		clearInterval(interval);
	});
	addEvent('mousedown', document.getElementById('start-btn'), function(keyEvent) {
		interval = setInterval(clickBtn(keyEvent, 13), 10);
	});
	addEvent('mouseup', document.getElementById('start-btn'), function() {
		releaseBtn(keyEvent, 13);
		clearInterval(interval);
	});
	addEvent('mousedown', document.getElementById('select-btn'), function(keyEvent) {
		interval = setInterval(clickBtn(keyEvent, 16), 10);
	});
	addEvent('mouseup', document.getElementById('select-btn'), function() {
		releaseBtn(keyEvent, 16);
		clearInterval(interval);
	});

// touchable joypad
	addEvent('touchstart', document.getElementById('a-btn'), function(keyEvent) {
		interval = setInterval(clickBtn(keyEvent, 88), 10);
	});
	addEvent('touchend', document.getElementById('a-btn'), function() {
		releaseBtn(keyEvent, 88);
		clearInterval(interval);
	});
	addEvent('touchstart', document.getElementById('b-btn'), function(keyEvent) {
		interval = setInterval(clickBtn(keyEvent, 90), 10);
	});
	addEvent('touchend', document.getElementById('b-btn'), function() {
		releaseBtn(keyEvent, 90);
		clearInterval(interval);
	});
	addEvent('touchstart', document.getElementById('up-btn'), function(keyEvent) {
		interval = setInterval(clickBtn(keyEvent, 38), 10);
	});
	addEvent('touchend', document.getElementById('up-btn'), function() {
		releaseBtn(keyEvent, 38);
		clearInterval(interval);
	});
	addEvent('touchstart', document.getElementById('down-btn'), function(keyEvent) {
		interval = setInterval(clickBtn(keyEvent, 40), 10);
	});
	addEvent('touchend', document.getElementById('down-btn'), function() {
		releaseBtn(keyEvent, 40);
		clearInterval(interval);
	});
	addEvent('touchstart', document.getElementById('left-btn'), function(keyEvent) {
		interval = setInterval(clickBtn(keyEvent, 37), 10);
	});
	addEvent('touchend', document.getElementById('left-btn'), function() {
		releaseBtn(keyEvent, 37);
		clearInterval(interval);
	});
	addEvent('touchstart', document.getElementById('right-btn'), function(keyEvent) {
		interval = setInterval(clickBtn(keyEvent, 39), 10);
	});
	addEvent('touchend', document.getElementById('right-btn'), function() {
		releaseBtn(keyEvent, 39);
		clearInterval(interval);
	});
	addEvent('touchstart', document.getElementById('start-btn'), function(keyEvent) {
		interval = setInterval(clickBtn(keyEvent, 13), 10);
	});
	addEvent('touchend', document.getElementById('start-btn'), function() {
		releaseBtn(keyEvent, 13);
		clearInterval(interval);
	});
	addEvent('touchstart', document.getElementById('select-btn'), function(keyEvent) {
		interval = setInterval(clickBtn(keyEvent, 16), 10);
	});
	addEvent('touchend', document.getElementById('select-btn'), function() {
		releaseBtn(keyEvent, 16);
		clearInterval(interval);
	});
// ****************************************************************************
	addEvent("keydown", document, keyDown);
	addEvent("keyup", document,  function (event) {
		if (event.keyCode == 27) {
			//Fullscreen on/off
			fullscreenPlayer();
		}
		else {
			//Control keys / other
			keyUp(event);
		}
	});
	addEvent("MozOrientation", window, GameBoyGyroSignalHandler);
	addEvent("deviceorientation", window, GameBoyGyroSignalHandler);
	addEvent("click", document.getElementById("enable-sound"), function () {
		soundBtn = document.getElementById("enable-sound");
		settings[0] = soundBtn.getAttribute('value');

		if (settings[0] == 'true') {
			soundBtn.style.background = 'none';
			soundBtn.innerText = 'sound off';
			soundBtn.setAttribute('value','false');
			soundBtn.setAttribute('title', 'enable sound');
			settings[0] = false;
		} else {
			soundBtn.style.background = 'rgb(153, 153, 153)';
			soundBtn.innerText = 'sound on';
			soundBtn.setAttribute('value','true');
			soundBtn.setAttribute('title', 'disable sound');
			settings[0] = true;
		};

		if (GameBoyEmulatorInitialized()) {
			gameboy.initSound();
		}
	});
	addEvent("mouseup", document.getElementById("gfx"), initNewCanvasSize);
	addEvent("resize", window, initNewCanvasSize);
	addEvent("unload", window, function () {
		autoSave();
	});
	for(let i=0; i<arrows.length; i++) {
		addEvent("click", arrows[i], function() {
			if(arrows[i].style.transform == 'rotate(180deg)') {
				pushInDrawers();
			} else {
				pushInDrawers();
				arrows[i].style.transform = 'rotate(180deg)';
				drawers[i].style.transform = 'translateX(0px)';
			}
		})
	};
};

function keyDown(event) {
	var keyCode = event.keyCode;
	var keyMapLength = keyZones.length;
	for (var keyMapIndex = 0; keyMapIndex < keyMapLength; ++keyMapIndex) {
		var keyCheck = keyZones[keyMapIndex];
		var keysMapped = keyCheck[1];
		var keysTotal = keysMapped.length;
		for (var index = 0; index < keysTotal; ++index) {
			if (keysMapped[index] == keyCode) {
				GameBoyKeyDown(keyCheck[0]);
				try {
					event.preventDefault();
				}
				catch (error) { }
			}
		}
	}
};
function keyUp(event) {
	var keyCode = event.keyCode;
	var keyMapLength = keyZones.length;
	for (var keyMapIndex = 0; keyMapIndex < keyMapLength; ++keyMapIndex) {
		var keyCheck = keyZones[keyMapIndex];
		var keysMapped = keyCheck[1];
		var keysTotal = keysMapped.length;
		for (var index = 0; index < keysTotal; ++index) {
			if (keysMapped[index] == keyCode) {
				GameBoyKeyUp(keyCheck[0]);
				try {
					event.preventDefault();
				}
				catch (error) { }
			}
		}
	}
};
function initPlayer() {
	document.getElementById("fullscreenContainer").style.display = "none";
};
function fullscreenPlayer() {
	if (GameBoyEmulatorInitialized()) {
		if (!inFullscreen) {
			gameboy.canvas = fullscreenCanvas;
			fullscreenCanvas.className = (showAsMinimal) ? "minimum" : "maximum";
			document.getElementById("fullscreenContainer").style.display = "block";
			windowStacks[0].hide();
		}
		else {
			gameboy.canvas = mainCanvas;
			document.getElementById("fullscreenContainer").style.display = "none";
			windowStacks[0].show();
		}
		gameboy.initLCD();
		inFullscreen = !inFullscreen;
	}
	else {
		console.log("Cannot go into fullscreen mode.", 2);
	}
};
//Some wrappers and extensions for non-DOM3 browsers:
function isDescendantOf(ParentElement, toCheck) {
	if (!ParentElement || !toCheck) {
		return false;
	}
	//Verify an object as either a direct or indirect child to another object.
	function traverseTree(domElement) {
		while (domElement != null) {
			if (domElement.nodeType == 1) {
				if (isSameNode(domElement, toCheck)) {
					return true;
				}
				if (hasChildNodes(domElement)) {
					if (traverseTree(domElement.firstChild)) {
						return true;
					}
				}
			}
			domElement = domElement.nextSibling;
		}
		return false;
	}
	return traverseTree(ParentElement.firstChild);
};
function hasChildNodes(oElement) {
	return (typeof oElement.hasChildNodes == "function") ? oElement.hasChildNodes() : ((oElement.firstChild != null) ? true : false);
};
function isSameNode(oCheck1, oCheck2) {
	return (typeof oCheck1.isSameNode == "function") ? oCheck1.isSameNode(oCheck2) : (oCheck1 === oCheck2);
};
function pageXCoord(event) {
	if (typeof event.pageX == "undefined") {
		return event.clientX + document.documentElement.scrollLeft;
	}
	return event.pageX;
};
function pageYCoord(event) {
	if (typeof event.pageY == "undefined") {
		return event.clientY + document.documentElement.scrollTop;
	}
	return event.pageY;
};
function mouseLeaveVerify(oElement, event) {
	//Hook target element with onmouseout and use this function to verify onmouseleave.
	return isDescendantOf(oElement, (typeof event.target != "undefined") ? event.target : event.srcElement) && !isDescendantOf(oElement, (typeof event.relatedTarget != "undefined") ? event.relatedTarget : event.toElement);
};
function mouseEnterVerify(oElement, event) {
	//Hook target element with onmouseover and use this function to verify onmouseenter.
	return !isDescendantOf(oElement, (typeof event.target != "undefined") ? event.target : event.srcElement) && isDescendantOf(oElement, (typeof event.relatedTarget != "undefined") ? event.relatedTarget : event.fromElement);
};
function addEvent(sEvent, oElement, fListener) {
	try {	
		oElement.addEventListener(sEvent, fListener, false);
		// console.log("In addEvent() : Standard addEventListener() called to add a(n) \"" + sEvent + "\" event.", -1);
	}
	catch (error) {
		oElement.attachEvent("on" + sEvent, fListener);	//Pity for IE.
		// console.log("In addEvent() : Nonstandard attachEvent() called to add an \"on" + sEvent + "\" event.", -1);
	}
};
function removeEvent(sEvent, oElement, fListener) {
	try {	
		oElement.removeEventListener(sEvent, fListener, false);
		// console.log("In removeEvent() : Standard removeEventListener() called to remove a(n) \"" + sEvent + "\" event.", -1);
	}
	catch (error) {
		oElement.detachEvent("on" + sEvent, fListener);	//Pity for IE.
		// console.log("In removeEvent() : Nonstandard detachEvent() called to remove an \"on" + sEvent + "\" event.", -1);
	}
};

// new stuff
async function loadNewGame(filepath, callback) {
	const filename = filepath.split('/')[2];
	const response = await fetch(filepath, {
		method: 'GET',
		responseType: 'blob'
	})
	const blob = await response.blob();
	const myfile = new File([blob], filename, {type:blob});
	callback(blob, myfile);
	return [blob, myfile]
};
function loadSavedGame(filepath, callback) {
	var xhr = new XMLHttpRequest();
	const filename = filepath.split('/')[2];
	xhr.open("GET", filepath, true);
	xhr.send();

	xhr.onreadystatechange = function() {
		if (this.status==200) {
			try {
				saveStateArray = JSON.parse(xhr.response);
				callback(saveStateArray);
				var game = document.getElementById("active-cart").textContent
				updateInterval = setInterval(
					function () {
						if(!intervalPaused) {
							updateParty(gameboy.saveState(), 'gif', game, clear=false);	
						}
					},
					5000
				);
				return saveStateArray;
			} catch(err) {
				if (!(err instanceof SyntaxError)) {
					console.log(err);
				}
			};

		};
	};
};
function loadNewGameFunc(gameFile) {
	var cartridge = loadNewGame('/carts/' + gameFile, function(blob, file) {
		var reader = new FileReader();
		reader.addEventListener('load', function (e) {
			initPlayer();
			start(mainCanvas, e.target.result);
		});
		reader.readAsBinaryString(file);
	});
};
function loadSavedGameFunc(saveFileLoc) {
	var savedGame = loadSavedGame('/carts/saves/' + saveFileLoc, function(saveState){
		clearLastEmulation();
		gameboy = new GameBoyCore(mainCanvas, "");
		gameboy.savedStateFileName = saveFileLoc;
		gameboy.returnFromState(saveState);
		run();
	});
};
function loadSavedorNewGame(clickedCode, game, gameFile, saveFileLoc) {
	document.getElementById("on-light").style.opacity = 1;
	var speedInput = document.getElementById('speed-input');
	speedInput.disabled = false;
	speedInput.value = 1;
	// backgroundSwitch(game);
	pullOutPartyDrawer();
	clearParty();
	try {
		clearInterval(updateInterval);
	} catch(err) {
		if (!(err instanceof ReferenceError)) {
			console.log(err)
		}
	};

	if (clickedCode == "new") {
		loadNewGameFunc(gameFile);
	} else {
		loadSavedGameFunc(saveFileLoc);
	};
};
function uploadSaveFile(file, savename) {
	const filename = savename + ".json";
	const dest = "/genone/roms/" + filename;
	var myFile;

	str = JSON.stringify(file)
	myFile = new File([str], filename, {
		type: file.type
	});

	formData = new FormData();
	formData.append("upload", myFile);

	var xhr = new XMLHttpRequest();
	xhr.open("POST", dest, true);
	xhr.send(formData);

	xhr.onreadystatechange = function() {
		if (this.status==200) {
			saver.style.background = 'rgba(153, 153, 153, 0)';
			saver.innerText = "save game";
		};
	};
};
function getVars(gameIdx) {
	var gameFile = gameList[gameIdx];
	var game = gameFile.split('.')[0];

	var activeCart = document.getElementById("active-cart");
	activeCart.textContent = game;
	var clicked = document.getElementById(game);
	var clickedCode = clicked.getAttribute('value');
	var saveFileLoc = clicked.getAttribute('name');
	return [gameFile, game, clickedCode, saveFileLoc]
};

// buttons
function clickBtn(eventObj, keyCode) {
	keyEvent = new KeyboardEvent("keydown", {
		bubbles : true,
		cancelable : true,
		char : "x",
		key : "x",
		shiftKey : false,
		keyCode : keyCode});
	document.dispatchEvent(keyEvent);
};
function releaseBtn(eventObj, keyCode) {
	keyEvent = new KeyboardEvent("keyup", {
		bubbles : true,
		cancelable : true,
		char : "x",
		key : "x",
		shiftKey : false,
		keyCode : keyCode});
	document.dispatchEvent(keyEvent);
};

// drawers
function pullOutPartyDrawer() {
	pushInDrawers();
	// partyArrow.style.transform = 'rotate(180deg)'
	// partyDrawer.style.transform = 'translateX(0)'
};
function pushInDrawers() {
	for(let i=0; i<drawers.length; i++) {
		arrows[i].style.transform = 'none';
		drawers[i].style.transform = 'translateX(-280px)';
	}
};