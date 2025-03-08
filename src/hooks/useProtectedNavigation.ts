'use client';

import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useRouter } from 'next/navigation';

export const useProtectedNavigation = () => {
    const { gameState, setGameState } = useGame();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const router = useRouter();

    const handleStaticPageNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        console.log('gameState', gameState);
        if (gameState.isPlaying) {
            e.preventDefault();
            setIsModalOpen(true);
            setPendingNavigation(path);
        }
    };

    const handleContinue = () => {
        if (pendingNavigation) {
            setGameState((prevState: any) => ({
                ...prevState,
                isPlaying: false
            }));
            router.push(pendingNavigation);
        }
        setIsModalOpen(false);
        setPendingNavigation(null);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setPendingNavigation(null);
    };

    return {
        isModalOpen,
        handleStaticPageNavigation,
        handleContinue,
        handleClose
    };
}; 