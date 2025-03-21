import { 
	GameBoyGyroSignalHandler,
	initNewCanvasSize,
	GameBoyKeyUp,
	GameBoyKeyDown
 } from "../GameBoyIO";

export var inFullscreen = false;
export var mainCanvas = null;
export var fullscreenCanvas = null;
export var showAsMinimal = false;
export var intervalPaused = false;

export function registerGUIEvents() {
	// console.log("In registerGUIEvents() : Registering GUI Events.", -1);
	try {
	// ****************************************************************************
		addEvent("MozOrientation", window, GameBoyGyroSignalHandler);
		addEvent("deviceorientation", window, GameBoyGyroSignalHandler);
		addEvent("resize", window, initNewCanvasSize);
	} catch (error) {
		console.log("Fatal windowing error: \"" + error.message + "\" file:" + error.fileName + " line: " + error.lineNumber, 2);
	}
};
//Wrapper for localStorage getItem, so that data can be retrieved in various types.
export function findValue(key) {
	try {
		if (window.localStorage.getItem(key) !== null) {
			return JSON.parse(window.localStorage.getItem(key));
		}
	}
	catch (error) {
		//An older Gecko 1.8.1/1.9.0 method of storage (Deprecated due to the obvious security hole):
		if (window.globalStorage[window.location.hostname].getItem(key) !== null) {
			return JSON.parse(window.globalStorage[window.location.hostname].getItem(key));
		}
	}
	return null;
}
//Wrapper for localStorage setItem, so that data can be set in various types.
export function setValue(key, value) {
	try {
		window.localStorage.setItem(key, JSON.stringify(value));
	}
	catch (error) {
		//An older Gecko 1.8.1/1.9.0 method of storage (Deprecated due to the obvious security hole):
		window.globalStorage[window.location.hostname].setItem(key, JSON.stringify(value));
	}
}
//Wrapper for localStorage removeItem, so that data can be set in various types.
export function deleteValue(key) {
	try {
		window.localStorage.removeItem(key);
	}
	catch (error) {
		//An older Gecko 1.8.1/1.9.0 method of storage (Deprecated due to the obvious security hole):
		window.globalStorage[window.location.hostname].removeItem(key);
	}
}

// key press helper functions
export function keyDown(event, gameboyInstance, keyMappings) {
	const keyPressed = event.key;
	for (const mapping of keyMappings) {
		if (mapping.key === keyPressed) {
			GameBoyKeyDown(mapping.button, gameboyInstance);
			try {
				event.preventDefault();
			} catch (error) { }
		}
	}
}

export function keyUp(event, gameboyInstance, keyMappings) {
	const keyPressed = event.key;
	for (const mapping of keyMappings) {
		if (mapping.key === keyPressed) {
			GameBoyKeyUp(mapping.button, gameboyInstance);
			try {
				event.preventDefault();
			} catch (error) { }
		}
	}
}

//Some wrappers and extensions for non-DOM3 browsers:
export function isDescendantOf(ParentElement, toCheck) {
	if (!ParentElement || !toCheck) {
		return false;
	}
	//Verify an object as either a direct or indirect child to another object.
	function traverseTree(domElement) {
		while (domElement !== null) {
			if (domElement.nodeType === 1) {
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
export function hasChildNodes(oElement) {
	return (typeof oElement.hasChildNodes === "function") ? oElement.hasChildNodes() : ((oElement.firstChild !== null) ? true : false);
};
export function isSameNode(oCheck1, oCheck2) {
	return (typeof oCheck1.isSameNode === "function") ? oCheck1.isSameNode(oCheck2) : (oCheck1 === oCheck2);
};
export function addEvent(sEvent, oElement, fListener) {
	try {	
		oElement.addEventListener(sEvent, fListener, false);
		// console.log("In addEvent() : Standard addEventListener() called to add a(n) \"" + sEvent + "\" event.", -1);
	}
	catch (error) {
		oElement.attachEvent("on" + sEvent, fListener);	//Pity for IE.
		// console.log("In addEvent() : Nonstandard attachEvent() called to add an \"on" + sEvent + "\" event.", -1);
	}
};
export function removeEvent(sEvent, oElement, fListener) {
	try {	
		oElement.removeEventListener(sEvent, fListener, false);
		// console.log("In removeEvent() : Standard removeEventListener() called to remove a(n) \"" + sEvent + "\" event.", -1);
	}
	catch (error) {
		oElement.detachEvent("on" + sEvent, fListener);	//Pity for IE.
		// console.log("In removeEvent() : Nonstandard detachEvent() called to remove an \"on" + sEvent + "\" event.", -1);
	}
};