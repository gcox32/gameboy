'use client';

import { createContext, useContext, useState, useCallback, useRef, MutableRefObject } from 'react';
import { GameModel, GameState, nullGameState, SRAMArray } from '@/types';

interface GameContextValue {
    gameState: GameState;
    startGame: (gameData: GameModel) => void;
    stopGame: () => void;
    setGameState: (gameState: GameState) => void;
    // Memory refs for scanning
    inGameMemoryRef: MutableRefObject<SRAMArray>;
    mbcRamRef: MutableRefObject<SRAMArray>;
    setMemoryRefs: (inGameMemory: SRAMArray, mbcRam: SRAMArray) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

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

    // Memory refs for accessing emulator memory
    const inGameMemoryRef = useRef<SRAMArray>([]);
    const mbcRamRef = useRef<SRAMArray>([]);

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
                // Clear memory refs when stopping
                inGameMemoryRef.current = [];
                mbcRamRef.current = [];
                return {
                    isPlaying: false,
                    activeGame: nullGameState.activeGame,
                    lastSaved: null
                };
            }
            return prev;
        });
    }, []);

    const setMemoryRefs = useCallback((inGameMemory: SRAMArray, mbcRam: SRAMArray) => {
        inGameMemoryRef.current = inGameMemory;
        mbcRamRef.current = mbcRam;
    }, []);

    return (
        <GameContext.Provider value={{
            gameState,
            startGame,
            stopGame,
            setGameState,
            inGameMemoryRef,
            mbcRamRef,
            setMemoryRefs
        }}>
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