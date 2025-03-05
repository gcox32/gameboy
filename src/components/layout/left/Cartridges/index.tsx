import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';
import GameManagement from '@/components/modals/GameManagement';
import styles from './styles.module.css';

const client = generateClient<Schema>();
function Cartridges({ onROMSelected, isDisabled, activeSaveState, currentUser }) {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isGameManagementOpen, setIsGameManagementOpen] = useState(false);

    const fetchGames = async () => {
        try {
            const gamesList = await client.models.Game.list({
                filter: {
                    owner: { eq: currentUser.userId }
                }
            });
            setGames(gamesList.data);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGames();
    }, [currentUser]);

    const handleROMChange = (e) => {
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

            <div className={styles.manageGamesButton} onClick={() => setIsGameManagementOpen(true)}>Manage Games</div>
            <GameManagement
                isOpen={isGameManagementOpen}
                onClose={() => setIsGameManagementOpen(false)}
                onGameDeleted={fetchGames}
            />  
            <div id={styles.activeGameTitle} className={activeSaveState ? "" : styles.null}>
                { activeSaveState ? activeSaveState.title : '' }
            </div>
        </>
    );
}

export default Cartridges;

