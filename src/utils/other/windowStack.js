import { 
	addEvent,
	removeEvent,
	isDescendantOf,
	isSameNode
} from './gui.js';

export var windowStacks = [];
export function windowCreate(displayComponent, bShow) {
	var oWindow = new WindowStack(displayComponent);
	if (bShow) {
		oWindow.show();
	}
	return oWindow;
}

class WindowStack {
	constructor(element) {
		if (element !== null && typeof element === "object") {
			this.lastOpacity = null;
			this.domObject = element;
			this.hadFocus = true;
			this.hookedMouse = false;
		}
	}

	registerMouseEvents() {
		if (!this.hookedMouse) {
			this.hookedMouse = true;
			var eventIndex = null;
			for (eventIndex in this.events) {
				addEvent(this.events[eventIndex][0], document, this.events[eventIndex][1]);
			}
			this.center();
		}
	}

	unregisterMouseEvents() {
		if (this.hookedMouse) {
			this.hookedMouse = false;
			var eventIndex = null;
			for (eventIndex in this.events) {
				removeEvent(this.events[eventIndex][0], document, this.events[eventIndex][1]);
			}
		}
	}

	getStyleFloatOf(propertyNameOf, JSpropertyNameOf) {
		try {
			var dirtyValue = window.getComputedStyle(this.domObject, null).getPropertyValue(propertyNameOf);
		}
		catch (error) {
			try {
				var dirtyValue = this.domObject.currentStyle.getAttribute(JSpropertyNameOf);	/*JS object notation style keywords, not the CSS keywords!*/
			}
			catch (error) {
				console.log(error.message, 2);
			}
		}
		var cleanValue = parseFloat((dirtyValue !== null && dirtyValue.length) ? dirtyValue : "0");
		return (!isNaN(cleanValue) && cleanValue !== -1) ? cleanValue : 0;	/*Note: Opera gives -1, not NaN for cleanValue when no number is found.*/
	}

	dragEnable(event) {
		var elementAt = document.elementFromPoint(event.clientX, event.clientY);
		this.leftPos = this.getStyleFloatOf("left", "left");
		this.topPos = this.getStyleFloatOf("top", "top");
		var highX = this.leftPos + this.domObject.offsetWidth - document.documentElement.scrollLeft - document.getElementsByTagName("body")[0].scrollLeft;
		var highY = this.topPos + this.domObject.offsetHeight - document.documentElement.scrollTop - document.getElementsByTagName("body")[0].scrollTop;
		var mousedWindow = isSameNode(elementAt, this.domObject);
		this.mousedInsideWindow = (mousedWindow) ? false : isDescendantOf(this.domObject, elementAt);
		if (mousedWindow || this.mousedInsideWindow) {
			this.movable = true;
			this.leftLast = event.clientX;
			this.topLast = event.clientY;
			this.domObject.style.zIndex = 2;
			if (highX - this.leftLast < 25 && highY - this.topLast < 25) {	/*Inivisible resize corner area for windows.*/
				this.resize = true;
			}
			else {
				this.resize = false;
			}
			this.coordDiffLeft = this.leftLast - this.leftPos;
			this.coordDiffTop = this.topLast - this.topPos;
			this.lastLeft = 0;
			this.lastTop = 0;
		}
		else {
			this.lostFocus();
		}
	}

	drag(event) {
		if (this.movable) {
			this.lastLeft += event.clientX - this.coordDiffLeft;
			this.lastTop += event.clientY - this.coordDiffTop;
			if (this.resize) {
				var newWidth = this.domObject.clientWidth + event.clientX - this.leftLast - this.getStyleFloatOf("padding-left", "paddingLeft") - this.getStyleFloatOf("padding-right", "paddingRight");
				var newHeight = this.domObject.clientHeight + event.clientY - this.topLast - this.getStyleFloatOf("padding-top", "paddingTop") - this.getStyleFloatOf("padding-bottom", "paddingBottom");
				if (this.getStyleFloatOf("min-width", "minWidth") <= newWidth && this.getStyleFloatOf("min-height", "minHeight") <= newHeight && ((this.getStyleFloatOf("max-width", "maxWidth") >= newWidth || this.getStyleFloatOf("max-width", "maxWidth") === 0) && (this.getStyleFloatOf("max-height", "maxHeight") >= newHeight || this.getStyleFloatOf("max-height", "maxHeight") === 0))) {
					this.domObject.style.width = newWidth + "px";
					this.domObject.style.height = newHeight + "px";
				}
			}
			else if (!this.mousedInsideWindow) {
				this.domObject.style.left = this.lastLeft + "px";
				this.domObject.style.top = this.lastTop + "px";
			}
			this.coordDiffLeft = this.leftLast = event.clientX;
			this.coordDiffTop = this.topLast = event.clientY;
		}
	}

	dragDisable() {
		this.movable = false;
		this.hadFocus = true;
	}

	lostFocus() {
		if (this.hadFocus) {
			this.domObject.style.zIndex = 1;
			this.hadFocus = false;
		}
	}

	interceptOpacity() {
		if (this.lastOpacity !== null) {
			this.lastOpacity.bDoneRun = true;
			return this.lastOpacity.RefOpacityAREABegin;
		}
		var sampledOpacity = this.getStyleFloatOf("opacity", "opacity") * 100;
		return (sampledOpacity > 0) ? sampledOpacity : 100;	/*Dirty opacity first-set for IE*/
	}

	center() {
		var docWidth = Math.max(document.documentElement.clientWidth, document.getElementsByTagName("body")[0].clientWidth);
		var docHeight = Math.max(document.documentElement.clientHeight, document.getElementsByTagName("body")[0].clientHeight);
		var docLeft = Math.max(document.documentElement.scrollLeft, document.getElementsByTagName("body")[0].scrollLeft);
		var docTop = Math.max(document.documentElement.scrollTop, document.getElementsByTagName("body")[0].scrollTop);
		this.domObject.style.left = Math.round(((docWidth - this.domObject.offsetWidth) / 2) + docLeft) + "px";
		this.domObject.style.top = Math.round(((docHeight - this.domObject.offsetHeight) / 2) + docTop) + "px";
	}

	hide() {
		this.domObject.style.display = "none";
		this.unregisterMouseEvents();
	}

	show() {
		this.domObject.style.display = "block";
		this.registerMouseEvents();
	}
}
