import { useRef } from 'react';

/**
 * Pauses the game while a modal is open, and on close resumes it only if
 * opening the modal is what paused it. A game the player had already paused
 * stays paused.
 */
export function useModalPause(intervalPaused: boolean, onPauseResume: () => void) {
    const pausedByModal = useRef(false);

    const pauseForModal = () => {
        pausedByModal.current = !intervalPaused;
        if (!intervalPaused) onPauseResume();
    };

    const resumeAfterModal = () => {
        if (!pausedByModal.current) return;
        pausedByModal.current = false;
        if (intervalPaused) onPauseResume();
    };

    return { pauseForModal, resumeAfterModal };
}
