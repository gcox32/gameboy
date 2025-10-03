import React, { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';
import styles from './styles.module.css';
import { GameModel } from '@/types/models';
import buttons from '@/styles/buttons.module.css';
import { CartridgesProps } from '@/types/schema';

const client = generateClient<Schema>();
function Cartridges({ onROMSelected, isDisabled, activeSaveState, currentUser, onOpenGameManagement }: CartridgesProps) {
    const [games, setGames] = useState<GameModel[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchGames = useCallback(async () => {
        try {
            const gamesList = await client.models.Game.list({
                filter: {
                    owner: { eq: currentUser.userId }
                }
            });
            setGames(gamesList.data as GameModel[]);
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
            <div className={buttons.buttonGroup}>
            <button className={buttons.primaryButton} onClick={onOpenGameManagement}>Manage Games</button>
                <div id={styles.activeGameTitle} className={activeSaveState ? "" : styles.null}>
                    { activeSaveState ? activeSaveState.title : '' }
                </div>
            </div>
        </>
    );
}

export default Cartridges;

