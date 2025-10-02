import React, { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';
import styles from './styles.module.css';
import { Game } from '@/types/schema';

interface CartridgesProps {
    onROMSelected: (rom: any) => void;
    isDisabled: boolean;
    activeSaveState: any;
    currentUser: any;
    activeROM: Game | null;
    onOpenGameManagement: () => void;
}

const client = generateClient<Schema>();
function Cartridges({ onROMSelected, isDisabled, activeSaveState, currentUser, activeROM, onOpenGameManagement }: CartridgesProps) {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchGames = useCallback(async () => {
        try {
            const gamesList = await client.models.Game.list({
                filter: {
                    owner: { eq: currentUser.userId }
                }
            });
            setGames(gamesList.data as Game[]);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchGames();
    }, [fetchGames]);

    const handleROMChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = e.target.value;
        const selectedROM = games.find(game => game.filePath === selectedValue);
        // Pass the selected ROM object to the callback
        onROMSelected(selectedROM);
    };


    // Handling loading and error states in the component's return statement
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <>
            <select onChange={handleROMChange} disabled={isDisabled} className={styles.romSelector}>
                <option value="">Select a Game</option>
                {games.map(game => (
                    <option key={game.id} value={game.filePath}>
                        {game.title}
                    </option>
                ))}
            </select>

            <div className={styles.manageGamesButton} onClick={onOpenGameManagement}>Manage Games</div>
            <div id={styles.activeGameTitle} className={activeSaveState ? "" : styles.null}>
                { activeSaveState ? activeSaveState.title : '' }
            </div>
        </>
    );
}

export default Cartridges;

