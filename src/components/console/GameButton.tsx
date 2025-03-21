import React, { useState, useEffect } from 'react';
import { defaultKeyMappings } from '@/contexts/SettingsContext';

interface GameButtonProps {
    className: string;
    button: string;
}

function GameButton({className, button }: GameButtonProps) {
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

    const clickBtn = () => {
        const keyEvent = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: defaultKeyMappings.find(mapping => mapping.button === button)?.key,
            shiftKey: false,
            keyCode: defaultKeyMappings.find(mapping => mapping.button === button)?.keyCode
        });
        document.dispatchEvent(keyEvent);
    };

    const releaseBtn = () => {
        const keyEvent = new KeyboardEvent("keyup", {
            bubbles: true,
            cancelable: true,
            key: defaultKeyMappings.find(mapping => mapping.button === button)?.key,
            shiftKey: false,
            keyCode: defaultKeyMappings.find(mapping => mapping.button === button)?.keyCode
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
