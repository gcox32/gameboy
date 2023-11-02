import React, { useState, useEffect } from 'react';

function GameButton({ elementId, className, keyCode }) {
    const [intervalId, setIntervalId] = useState(null);

    const clickBtn = () => {
        const keyEvent = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            char: 'x',
            key: 'x',
            shiftKey : false,
            keyCode: keyCode
        });
        document.dispatchEvent(keyEvent);
    };

    const releaseBtn = () => {
        const keyEvent = new KeyboardEvent("keyup", {
            bubbles: true,
            cancelable: true,
            char: 'x',
            key: 'x',
            shiftKey : false,
            keyCode: keyCode
        });
        document.dispatchEvent(keyEvent);
        clearInterval(intervalId);
        setIntervalId(null);
    };

    const handleInteractionStart = () => {
        const id = setInterval(() => clickBtn(), 10);
        setIntervalId(id);
    };

    const handleInteractionEnd = () => {
        releaseBtn();
    };

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [intervalId]);

    return (
        <div
            id={elementId}
            className={className}
            onMouseDown={handleInteractionStart}
            onMouseUp={handleInteractionEnd}
            onTouchStart={handleInteractionStart}
            onTouchEnd={handleInteractionEnd}
        >
        </div>
    );
}

export default GameButton;
