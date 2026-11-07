'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useGames } from '@/contexts/GamesContext';
import { fetchUserSaveStates } from '@/utils/saveLoad';
import { GameModel, SaveStateModel } from '@/types';

const STORAGE_KEY = 'currentGame';

interface Stored {
    gameId?: string;
    saveId?: string;
}

function readStored(): Stored {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') ?? {};
    } catch {
        return {};
    }
}

function writeStored(value: Stored) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {}
}

interface CurrentGameValue {
    /** The game the player is working with, on Play, in the Lab and at the Ranch */
    game: GameModel | null;
    /** The save they're working with. Always the latest copy from `saveStates`. */
    save: SaveStateModel | null;
    /** Every save for `game` */
    saveStates: SaveStateModel[];
    /** Choosing a different game clears the save */
    setGame: (game: GameModel | null) => void;
    setSave: (save: SaveStateModel | null) => void;
    /** Re-reads the save list, which picks up a save's new file or connection */
    refreshSaves: () => Promise<SaveStateModel[]>;
}

const CurrentGameContext = createContext<CurrentGameValue | null>(null);

export function CurrentGameProvider({ children }: { children: ReactNode }) {
    const { games, isLoading: gamesLoading } = useGames();
    const [game, setGameState] = useState<GameModel | null>(null);
    const [chosenSave, setChosenSave] = useState<SaveStateModel | null>(null);
    const [saveStates, setSaveStates] = useState<SaveStateModel[]>([]);
    // The last game and save come back once the games have loaded
    const [restored, setRestored] = useState(false);
    const pendingSaveId = useRef<string | undefined>(undefined);
    const gameId = game?.id ?? '';

    const setGame = useCallback((next: GameModel | null) => {
        if ((next?.id ?? '') !== gameId) {
            setChosenSave(null);
            setSaveStates([]);
            pendingSaveId.current = undefined;
        }
        setGameState(next);
    }, [gameId]);

    const refreshSaves = useCallback(async () => {
        if (!gameId) {
            setSaveStates([]);
            return [];
        }
        const list: SaveStateModel[] = await fetchUserSaveStates(undefined, gameId);
        setSaveStates(list);
        return list;
    }, [gameId]);

    useEffect(() => {
        if (restored || gamesLoading) return;
        const stored = readStored();
        const found = games.find(g => g.id === stored.gameId) ?? null;
        // Unless a game was chosen while the list was loading
        if (found && !gameId) {
            setGameState(found);
            pendingSaveId.current = stored.saveId;
        }
        setRestored(true);
    }, [restored, gamesLoading, games, gameId]);

    useEffect(() => {
        let cancelled = false;
        if (!gameId) return;
        fetchUserSaveStates(undefined, gameId).then((list: SaveStateModel[]) => {
            if (cancelled) return;
            setSaveStates(list);
            if (pendingSaveId.current) {
                setChosenSave(list.find(s => s.id === pendingSaveId.current) ?? null);
                pendingSaveId.current = undefined;
            }
        });
        return () => { cancelled = true; };
    }, [gameId]);

    // Forget a save once it's been deleted
    useEffect(() => {
        if (chosenSave?.id && saveStates.length > 0 && !saveStates.some(s => s.id === chosenSave.id)) {
            setChosenSave(null);
        }
    }, [saveStates, chosenSave?.id]);

    useEffect(() => {
        if (restored) writeStored({ gameId: game?.id, saveId: chosenSave?.id });
    }, [restored, game?.id, chosenSave?.id]);

    const save = chosenSave ? saveStates.find(s => s.id === chosenSave.id) ?? chosenSave : null;

    return (
        <CurrentGameContext.Provider value={{
            game,
            save,
            saveStates,
            setGame,
            setSave: setChosenSave,
            refreshSaves,
        }}>
            {children}
        </CurrentGameContext.Provider>
    );
}

export const useCurrentGame = () => {
    const context = useContext(CurrentGameContext);
    if (!context) throw new Error('useCurrentGame must be used within a CurrentGameProvider');
    return context;
};
