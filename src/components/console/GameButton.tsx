import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

interface GameButtonProps {
    className: string;
    button: string;
    label?: string;
}

function GameButton({className, button, label }: GameButtonProps) {
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
    // The emulator matches keys against the player's mappings, so a press has to send their key
    const mapping = useSettings().uiSettings.keyMappings.find(m => m.button === button);

    const clickBtn = () => {
        const keyEvent = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: mapping?.key,
            shiftKey: false,
            keyCode: mapping?.keyCode
        });
        document.dispatchEvent(keyEvent);
    };

    const releaseBtn = () => {
        const keyEvent = new KeyboardEvent("keyup", {
            bubbles: true,
            cancelable: true,
            key: mapping?.key,
            shiftKey: false,
            keyCode: mapping?.keyCode
        });
        document.dispatchEvent(keyEvent);
        if (intervalId) clearInterval(intervalId);
        setIntervalId(null);
    };

    const triggerHaptic = () => {
        // Check if vibration is supported and trigger a short vibration
        if (navigator.vibrate) {
            navigator.vibrate(50); // 50ms vibration
        }
    };

    const handleInteractionStart = () => {
        triggerHaptic(); // Add haptic feedback on button press
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
            {label}
        </div>
    );
}

export default GameButton;
