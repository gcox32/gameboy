'use client';
import { createContext, useContext, useState } from 'react';

const GameContext = createContext();

export function GameProvider({ children }) {
    const [gameState, setGameState] = useState({
        isPlaying: false,
        activeGame: null,
        lastSaved: null
    });

    const startGame = (gameData) => {
        setGameState({
            isPlaying: true,
            activeGame: gameData,
            lastSaved: Date.now()
        });
    };

    const stopGame = () => {
        setGameState({
            isPlaying: false,
            activeGame: null,
            lastSaved: null
        });
    };

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