'use client';
import { createContext, useContext, useState, useCallback } from 'react';

const GameContext = createContext<{
    gameState: any;
    startGame: (gameData: any) => void;
    stopGame: () => void;
    setGameState: (gameState: any) => void;
} | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
    const [gameState, setGameState] = useState<{
        isPlaying: boolean;
        activeGame: any;
        lastSaved: number | null;
    }>({
        isPlaying: false,
        activeGame: null,
        lastSaved: null
    });

    const startGame = useCallback((gameData: any) => {
        setGameState({
            isPlaying: true,
            activeGame: gameData,
            lastSaved: Date.now()
        });
    }, []);

    const stopGame = useCallback(() => {
        setGameState(prev => {
            if (prev.isPlaying) {
                return {
                    isPlaying: false,
                    activeGame: null,
                    lastSaved: null
                };
            }
            return prev;
        });
    }, []);

    return (
        <GameContext.Provider value={{ gameState, startGame, stopGame, setGameState }}>
            {children}
        </GameContext.Provider>
    );
}

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}; 