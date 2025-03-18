import React, { useState, useEffect } from 'react';

interface GameButtonProps {
    className: string;
    keyCode: string;
}

function GameButton({className, keyCode }: GameButtonProps) {
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

    const clickBtn = () => {
        const keyEvent = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: 'x',
            shiftKey: false,
            keyCode: parseInt(keyCode)
        });
        document.dispatchEvent(keyEvent);
    };

    const releaseBtn = () => {
        const keyEvent = new KeyboardEvent("keyup", {
            bubbles: true,
            cancelable: true,
            key: 'x',
            shiftKey: false,
            keyCode: parseInt(keyCode)
        });
        document.dispatchEvent(keyEvent);
        if (intervalId) clearInterval(intervalId);
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
