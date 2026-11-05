'use client';

import { useState, MouseEvent } from 'react';
import { useGame } from '@/contexts/GameContext';
import { usePathname, useRouter } from 'next/navigation';

export type ProtectedNavigateHandler = (e: MouseEvent<HTMLAnchorElement>, path: string) => void;

/**
 * Holds anything that would end a running game until the player confirms it.
 * Each call owns its own modal state, so a component must render
 * GameInterruptModal from the same instance it guards with.
 */
export const useProtectedNavigation = () => {
    const { gameState, setGameState } = useGame();
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    const guardAction = (action: () => void) => {
        if (gameState.isPlaying) {
            setPendingAction(() => action);
        } else {
            action();
        }
    };

    const handleStaticPageNavigation: ProtectedNavigateHandler = (e, path) => {
        // A link to this page, or one opening in a new tab, leaves the game running
        if (path === pathname || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (gameState.isPlaying) {
            e.preventDefault();
            setPendingAction(() => () => router.push(path));
        }
    };

    const handleContinue = () => {
        if (pendingAction) {
            setGameState({
                ...gameState,
                isPlaying: false
            });
            pendingAction();
        }
        setPendingAction(null);
    };

    const handleClose = () => {
        setPendingAction(null);
    };

    return {
        isModalOpen: pendingAction !== null,
        guardAction,
        handleStaticPageNavigation,
        handleContinue,
        handleClose
    };
};
