import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import styles from './styles.module.css';
import { GameModel, SaveStateModel, AuthenticatedUser } from '@/types';
import buttons from '@/styles/buttons.module.css';

export interface CartridgesProps {
    onROMSelected: (rom: GameModel) => void;
    isDisabled: boolean;
    activeSaveState: SaveStateModel | null;
    currentUser: AuthenticatedUser;
    onOpenGameManagement: () => void;
}

interface GameModelExtended extends GameModel {
    _id?: string
}

function Cartridges({ onROMSelected, isDisabled, activeSaveState, currentUser, onOpenGameManagement }: CartridgesProps) {
    const [games, setGames] = useState<GameModelExtended[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchGames = useCallback(async () => {
        if (!currentUser?.userId) return;
        try {
            setLoading(true);
            const res = await fetch('/api/games');
            if (!res.ok) throw new Error('Failed to fetch games');
            setGames(await res.json());
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchGames();
    }, [fetchGames]);

    const handleROMChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const selectedROM = games.find(game => game.filePath === e.target.value);
        onROMSelected(selectedROM as GameModel);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <>
            <select onChange={handleROMChange} disabled={isDisabled} className={styles.romSelector}>
                <option value="">Select a Game</option>
                {games.map(game => (
                    <option key={game._id} value={game.filePath}>
                        {game.title}
                    </option>
                ))}
            </select>
            <div className={buttons.buttonGroup}>
                <button className={buttons.retroButton} onClick={onOpenGameManagement}>Manage Games</button>
                <div className={styles.activeGameTitle}>
                    {activeSaveState ? activeSaveState.title : ''}
                </div>
            </div>
        </>
    );
}

export default Cartridges;
