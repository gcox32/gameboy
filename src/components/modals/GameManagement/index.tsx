import { useState, useEffect, useCallback, Fragment } from 'react';
import BaseModal from '@/components/modals/BaseModal';
import ConfirmModal from '@/components/modals/utilities/ConfirmModal';
import {
    Flex,
    Heading,
    Alert,
    Text,
    View,
    Loader
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import styles from './styles.module.css';
import ImportGame from './ImportGame';
import GameEditForm from './GameEditForm';
import { useToast } from '@/components/ui';
import { getS3Url } from '@/utils/saveLoad';
import { uploadBlob } from '@/utils/blobUpload';
import { GameModel } from '@/types';
import buttons from '@/styles/buttons.module.css';

interface GameManagementProps {
    isOpen: boolean;
    onClose: () => void;
    onGameDeleted: () => void;
    onGameEdited?: (updatedGame: GameModel) => void;
    editingGame: GameModel | null;
    setEditingGame: (game: GameModel | null) => void;
}

export default function GameManagement({ isOpen, onClose, onGameDeleted, onGameEdited, editingGame, setEditingGame }: GameManagementProps) {
    const auth = useAuth();
    if (!auth) throw new Error('Auth context not available');
    const { user } = auth;
    const { showToast } = useToast();

    const [games, setGames] = useState<GameModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showImport, setShowImport] = useState(false);
    const [gameToDelete, setGameToDelete] = useState<GameModel | null>(null);
    const [skipDeleteConfirmation, setSkipDeleteConfirmation] = useState(false);
    const [gameImages, setGameImages] = useState<Record<string, string>>({});

    const loadGames = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/games');
            if (!res.ok) throw new Error('Failed to load games');
            setGames(await res.json());
        } catch (err) {
            setError('Failed to load games. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen && user) loadGames();
    }, [isOpen, user, loadGames]);

    useEffect(() => {
        const loadImages = async () => {
            const imageUrls: Record<string, string> = {};
            for (const game of games) {
                if (game.img) {
                    try {
                        imageUrls[game.id] = await getS3Url(game.img);
                    } catch { /* ignore */ }
                }
            }
            setGameImages(imageUrls);
        };
        if (games.length > 0) loadImages();
    }, [games]);

    const handleEditGame = async (gameData: GameModel & { imageFile?: File }) => {
        try {
            setLoading(true);
            setError(null);

            let imagePath = gameData.img || '';
            if (gameData.imageFile) {
                const ext = gameData.imageFile.name.split('.').pop() ?? 'jpg';
                const coverPath = `games/${user?.userId}/${gameData.id}/cover.${ext}`;
                imagePath = await uploadBlob(gameData.imageFile, coverPath);
            }

            const res = await fetch(`/api/games/${gameData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: gameData.title,
                    img: imagePath,
                    metadata: gameData.metadata,
                }),
            });
            if (!res.ok) throw new Error('Update failed');
            const updated: GameModel = await res.json();

            setEditingGame(null);
            setGames(prev => prev.map(g => g.id === updated.id ? updated : g));
            onGameEdited?.(updated);
            loadGames();
            showToast(`Saved changes to "${gameData.title}"`, 'success');
        } catch (err) {
            console.error(err);
            setError('Failed to update game. Please try again.');
            showToast('Failed to update game', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGame = async (game: GameModel) => {
        try {
            await fetch(`/api/games/${game.id}`, { method: 'DELETE' });
            setGameToDelete(null);
            setEditingGame(null);
            loadGames();
            onGameDeleted();
            showToast(`Deleted "${game.title}"`, 'success');
        } catch (err) {
            console.error(err);
            setError('Failed to delete game. Please try again.');
            showToast('Failed to delete game', 'error');
        }
    };

    const renderGameCard = (game: GameModel) => (
        <div className={styles.gameCardContainer}>
            <div className={styles.gameCard} onClick={() => setEditingGame(game)}>
                <div
                    className={styles.gameCardBackground}
                    style={gameImages[game.id] ? { backgroundImage: `url(${gameImages[game.id]})` } : undefined}
                />
            </div>
            <Text $fontSize="lg" $fontWeight="bold" className={styles.gameCardTitle}>{game.title}</Text>
        </div>
    );

    const renderContent = () => {
        if (loading) return <Loader variation="linear" />;
        if (error) return <Alert $variation="error">{error}</Alert>;

        if (showImport) {
            return (
                <ImportGame
                    userId={user?.userId}
                    onSuccess={() => { setShowImport(false); loadGames(); onGameDeleted(); }}
                    onCancel={() => setShowImport(false)}
                />
            );
        }

        if (editingGame) {
            return (
                <GameEditForm
                    game={editingGame}
                    gameImgRef={gameImages[editingGame.id]}
                    onSave={handleEditGame as (gameData: GameModel & { imageFile?: File | null }) => Promise<void>}
                    onDelete={(game) => {
                        if (skipDeleteConfirmation) handleDeleteGame(game);
                        else setGameToDelete(game);
                    }}
                />
            );
        }

        if (games.length === 0) {
            return (
                <View $textAlign="center" $padding="2rem">
                    <Text>No games found. Import your first game to get started!</Text>
                    <button onClick={() => setShowImport(true)} className={buttons.retroButton}>Import</button>
                </View>
            );
        }

        return (
            <>
                <div className={styles.gameList}>{games.map(game => <Fragment key={game.id}>{renderGameCard(game)}</Fragment>)}</div>
                {gameToDelete && (
                    <Alert $variation="warning" isDismissible={false} hasIcon heading="Confirm Deletion">
                        <Flex $direction="column" $gap="1rem">
                            <Text>{`Are you sure you want to delete "${gameToDelete.title}"? This action cannot be undone.`}</Text>
                            <div className={buttons.buttonGroup} style={{ marginTop: '1rem', flexDirection: 'row', justifyContent: 'flex-end' }}>
                                <button className={buttons.retroButton} onClick={() => setGameToDelete(null)}>Cancel</button>
                                <button className={buttons.retroButton} onClick={() => handleDeleteGame(gameToDelete)}>Delete</button>
                            </div>
                        </Flex>
                    </Alert>
                )}
            </>
        );
    };

    return (
        <>
            <BaseModal isOpen={isOpen} onClose={onClose} className={styles.modal}>
                <Flex $direction="column" $gap="1.5rem" $padding="1.5rem">
                    <div
                        className={`${buttons.buttonGroup} ${styles.modalHeader}`}
                        style={{ marginTop: '1rem', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <Heading as="h4">
                            {showImport ? 'Import Game' : editingGame ? `Edit ${editingGame.title}` : 'Game Management'}
                        </Heading>
                        {!showImport && !editingGame && games.length > 0 && (
                            <button className={buttons.retroButton} onClick={() => setShowImport(true)}>Import</button>
                        )}
                    </div>
                    {renderContent()}
                </Flex>
            </BaseModal>

            <ConfirmModal
                isOpen={!!gameToDelete}
                onClose={() => setGameToDelete(null)}
                onConfirm={() => { if (gameToDelete) handleDeleteGame(gameToDelete); }}
                skipConfirmation={skipDeleteConfirmation}
                toggleSkipConfirmation={() => setSkipDeleteConfirmation(!skipDeleteConfirmation)}
            >
                {`Are you sure you want to delete "${gameToDelete?.title}"? This action cannot be undone.`}
            </ConfirmModal>
        </>
    );
}
