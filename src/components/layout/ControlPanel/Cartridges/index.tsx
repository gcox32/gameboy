import { useState, useEffect, useCallback } from 'react';
import styles from './styles.module.css';
import { GameModel, SaveStateModel, AuthenticatedUser } from '@/types';
import buttons from '@/styles/buttons.module.css';
import CartridgePickerModal from './CartridgePickerModal';

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
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState<GameModel | null>(null);

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

    const handleGameSelect = useCallback((game: GameModel) => {
        setSelectedGame(game);
        onROMSelected(game);
        setModalOpen(false);
    }, [onROMSelected]);

    return (
        <>
            <div className={buttons.buttonGroup}>
                <button
                    className={`${styles.pickerButton} ${isDisabled ? styles.pickerDisabled : ''}`}
                    onClick={() => !isDisabled && !loading && setModalOpen(true)}
                    disabled={isDisabled || loading}
                    aria-haspopup="dialog"
                >
                    {loading ? 'Loading…' : (selectedGame?.title ?? 'Select Game')}
                </button>
                {error && <span className={styles.errorText}>{error.message}</span>}
                <button className={buttons.retroButton} onClick={onOpenGameManagement}>Manage Games</button>
                <div className={styles.activeGameTitle}>
                    {activeSaveState ? activeSaveState.title : ''}
                </div>
            </div>
            <CartridgePickerModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                games={games}
                onSelect={handleGameSelect}
                selectedFilePath={selectedGame?.filePath}
            />
        </>
    );
}

export default Cartridges;
