'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GameModel } from '@/types';

interface GamesContextValue {
    games: GameModel[];
    /** True only until the first load finishes. Later refreshes happen behind the current list */
    isLoading: boolean;
    error: string | null;
    refreshGames: () => Promise<void>;
}

const GamesContext = createContext<GamesContextValue | null>(null);

export function GamesProvider({ children }: { children: ReactNode }) {
    const userId = useAuth()?.user?.userId;
    const [games, setGames] = useState<GameModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshGames = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await fetch('/api/games');
            if (!res.ok) throw new Error('Failed to load games');
            setGames(await res.json());
            setError(null);
        } catch (err) {
            console.error('Error fetching games:', err);
            setError('Failed to load games. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        refreshGames();
    }, [refreshGames]);

    return (
        <GamesContext.Provider value={{ games, isLoading, error, refreshGames }}>
            {children}
        </GamesContext.Provider>
    );
}

export const useGames = () => {
    const context = useContext(GamesContext);
    if (!context) throw new Error('useGames must be used within a GamesProvider');
    return context;
};
