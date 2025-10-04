'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { GameModel, GameState, nullGameState } from '@/types';

const GameContext = createContext<{
    gameState: GameState;
    startGame: (gameData: GameModel) => void;
    stopGame: () => void;
    setGameState: (gameState: GameState) => void;
} | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
    const [gameState, setGameState] = useState<{
        isPlaying: boolean;
        activeGame: GameModel;
        lastSaved: number | null;
    }>({
        isPlaying: false,
        activeGame: nullGameState.activeGame,
        lastSaved: null
    });

    const startGame = useCallback((gameData: GameModel) => {
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
                    activeGame: nullGameState.activeGame,
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