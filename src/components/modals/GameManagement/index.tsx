import { useState, useEffect } from 'react';
import BaseModal from '@/components/modals/BaseModal';
import ConfirmModal from '@/components/modals/utilities/ConfirmModal';
import {
    Button,
    Flex,
    Heading,
    Alert,
    Text,
    View,
    Loader
} from '@aws-amplify/ui-react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './styles.module.css';
import ImportGame from './ImportGame';
import GameEditForm from './GameEditForm';

import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';
import { uploadData } from 'aws-amplify/storage';
import { getS3Url } from '@/utils/saveLoad';
import { type AuthUser } from 'aws-amplify/auth';

const client = generateClient<Schema>();

interface Game {
    id: string;
    title: string;
    img?: string;
    filePath: string;
    metadata?: {
        description?: string;
        series?: string;
        generation?: string;
        releaseDate?: string;
    };
}

interface GameManagementProps {
    isOpen: boolean;
    onClose: () => void;
    onGameDeleted?: () => void;
}

export default function GameManagement({ isOpen, onClose, onGameDeleted }: GameManagementProps) {
    const auth = useAuth();
    if (!auth) throw new Error('Auth context not available');
    const { user } = auth as { user: AuthUser | null };

    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showImport, setShowImport] = useState(false);
    const [editingGame, setEditingGame] = useState<Game | null>(null);
    const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
    const [skipDeleteConfirmation, setSkipDeleteConfirmation] = useState(false);
    const [gameImages, setGameImages] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen && user) {
            loadGames();
        }
    }, [isOpen, user]);

    useEffect(() => {
        const loadImages = async () => {
            const imageUrls: Record<string, string> = {};
            for (const game of games) {
                if (game.img) {
                    try {
                        const url = await getS3Url(game.img);
                        imageUrls[game.id] = url;
                        console.log(imageUrls);
                    } catch (err) {
                        console.error('Error loading image for game:', game.id, err);
                    }
                }
            }
            setGameImages(imageUrls);
        };

        if (games.length > 0) {
            loadImages();
        }
    }, [games]);

    const loadGames = async () => {
        try {
            setLoading(true);
            setError(null);
            const userGames = await client.models.Game.list({
                filter: {
                    owner: { eq: user?.userId }
                }
            });
            console.log('userGames', userGames);
            setGames(userGames.data as unknown as Game[]);
        } catch (err) {
            setError('Failed to load games. Please try again.');
            console.error('Error loading games:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditGame = async (gameData: Game & { imageFile?: File }) => {
        try {
            setLoading(true);
            setError(null);

            // Handle image upload if a new image was provided
            let imagePath = gameData.img || '';
            if (gameData.imageFile) {
                const fileType = gameData.imageFile.name.split('.').pop();
                imagePath = `protected/${user?.userId}/games/${gameData.id}/cover.${fileType}`;

                await uploadData({
                    path: imagePath,
                    data: gameData.imageFile,
                    options: {
                        contentType: gameData.imageFile.type
                    }
                }).result;
            }

            // Update game record in database
            await client.models.Game.update({
                id: gameData.id,
                owner: user?.userId,
                title: gameData.title,
                img: imagePath,
                metadata: JSON.stringify({
                    description: gameData.metadata?.description || '',
                    series: gameData.metadata?.series || '',
                    generation: gameData.metadata?.generation || '',
                    releaseDate: gameData.metadata?.releaseDate || ''
                })
            });

            setEditingGame(null);
            loadGames();
        } catch (err) {
            console.error('Error updating game:', err);
            setError('Failed to update game. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGame = async (game: Game) => {
        try {
            await client.models.Game.delete({
                id: game.id
            });
            setGameToDelete(null);
            setEditingGame(null);  // Close edit form if open
            loadGames();
            onGameDeleted?.();
        } catch (err) {
            console.error('Error deleting game:', err);
            setError('Failed to delete game. Please try again.');
        }
    };

    const handleDeleteConfirmed = async () => {
        if (gameToDelete) {
            await handleDeleteGame(gameToDelete);
        }
    };

    const renderGameCard = (game: Game) => (
        <div className={styles.gameCardContainer} key={game.id}>
            <div
                className={styles.gameCard}
                onClick={() => setEditingGame(game)}
            >
                <div
                    className={styles.gameCardBackground}
                    style={gameImages[game.id] ? { backgroundImage: `url(${gameImages[game.id]})` } : undefined}
                />

            </div>
            <Text
                fontSize="1.1em"
                fontWeight="bold"
                className={styles.gameCardTitle}
            >
                {game.title}
            </Text>
        </div>
    );

    const renderContent = () => {
        if (loading) {
            return <Loader variation="linear" />;
        }

        if (error) {
            return <Alert variation="error">{error}</Alert>;
        }

        if (showImport) {
            return (
                <ImportGame
                    userId={user?.userId}
                    onSuccess={() => {
                        setShowImport(false);
                        loadGames();
                        onGameDeleted?.();
                    }}
                    onCancel={() => setShowImport(false)}
                />
            );
        }

        if (editingGame) {
            return (
                <GameEditForm
                    game={editingGame}
                    gameImgRef={gameImages[editingGame.id]}
                    onSave={handleEditGame as (gameData: Game & { imageFile?: File | null }) => Promise<void>}
                    onCancel={() => setEditingGame(null)}
                    onDelete={(game) => {
                        if (skipDeleteConfirmation) {
                            handleDeleteGame(game);
                        } else {
                            setGameToDelete(game);
                        }
                    }}
                />
            );
        }

        if (games.length === 0) {
            return (
                <View textAlign="center" padding="2rem">
                    <Text>No games found. Import your first game to get started!</Text>
                    <Button
                        onClick={() => setShowImport(true)}
                        variation="primary"
                        marginTop="1rem"
                    >
                        Import Game
                    </Button>
                </View>
            );
        }

        return (
            <>
                <div className={styles.gameList}>
                    {games.map(renderGameCard)}
                </div>

                {gameToDelete && (
                    <Alert
                        variation="warning"
                        isDismissible={false}
                        hasIcon={true}
                        heading="Confirm Deletion"
                    >
                        <Flex direction="column" gap="1rem">
                            <Text>
                                {`Are you sure you want to delete "${gameToDelete.title}"?
                                This action cannot be undone and will remove all associated save states.`}
                            </Text>
                            <Flex gap="1rem" justifyContent="flex-end">
                                <Button
                                    size="small"
                                    onClick={() => setGameToDelete(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="small"
                                    variation="destructive"
                                    onClick={() => handleDeleteGame(gameToDelete)}
                                >
                                    Delete
                                </Button>
                            </Flex>
                        </Flex>
                    </Alert>
                )}
            </>
        );
    };

    return (
        <>
            <BaseModal isOpen={isOpen} onClose={onClose} className={styles.modal}>
                <Flex direction="column" gap="1.5rem" padding="1.5rem">
                    <Flex justifyContent="space-between" alignItems="center">
                        <Heading level={4}>
                            {showImport ? 'Import Game' :
                                editingGame ? `Edit ${editingGame.title}` :
                                    'Game Management'}
                        </Heading>
                        {!showImport && !editingGame && games.length > 0 && (
                            <Button
                                variation="primary"
                                size="small"
                                onClick={() => setShowImport(true)}
                            >
                                Import Game
                            </Button>
                        )}
                    </Flex>

                    {renderContent()}
                </Flex>
            </BaseModal>

            <ConfirmModal
                isOpen={!!gameToDelete}
                onClose={() => setGameToDelete(null)}
                onConfirm={handleDeleteConfirmed}
                skipConfirmation={skipDeleteConfirmation}
                toggleSkipConfirmation={() => setSkipDeleteConfirmation(!skipDeleteConfirmation)}
            >
                {`Are you sure you want to delete "${gameToDelete?.title}"? This action cannot be undone and will remove all associated save states.`}
            </ConfirmModal>
        </>
    );
}