'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Flex,
    Text,
    Alert,
    Heading
} from '@/components/ui';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';
import DataTable from './DataTable';
import AdminModal from './AdminModal';
import SearchInput from './SearchInput';
import styles from '@/app/admin/styles.module.css';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Image from 'next/image';
import { getUrl } from 'aws-amplify/storage';
import { getUsernamesForSubs } from '@/utils/usernames';
import { useToast } from '@/components/ui';

interface Game {
    id: string;
    owner: string;
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

export default function GamesManagement() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingGame, setEditingGame] = useState<Game | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [imageUrlsByGameId, setImageUrlsByGameId] = useState<Record<string, string>>({});
    const [usernameBySub, setUsernameBySub] = useState<Record<string, string>>({});

    const client = generateClient<Schema>();
    const { showToast } = useToast();

    const loadGames = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await client.models.Game.list();
            const data = response.data as unknown as Game[];
            setGames(data);

            const owners = data.map((n) => n.owner).filter(Boolean);
            if (owners.length > 0) {
                const mapping = await getUsernamesForSubs(owners);
                setUsernameBySub((prev) => ({ ...prev, ...mapping }));
            }
        } catch (err) {
            setError('Failed to load games. Please try again.');
            console.error('Error loading games:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGames();
    }, [loadGames]);

    // Resolve presigned URLs for any game images that are stored in S3
    useEffect(() => {
        let isMounted = true;
        const resolveImageUrls = async () => {
            const nextMap: Record<string, string> = {};
            const tasks = games.map(async (game) => {
                if (!game.img) return;
                if (game.img.slice(0, 4) === 'http') {
                    nextMap[game.id] = game.img;
                    return;
                }
                try {
                    const { url } = await getUrl({ path: game.img });
                    nextMap[game.id] = String(url);
                } catch (e) {
                    // ignore failures for individual images
                }
            });
            await Promise.all(tasks);
            if (isMounted) {
                setImageUrlsByGameId(nextMap);
            }
        };

        if (games.length > 0) {
            resolveImageUrls();
        } else {
            setImageUrlsByGameId({});
        }

        return () => {
            isMounted = false;
        };
    }, [games]);

    const handleSort = (key: string, direction: 'asc' | 'desc') => {
        setSortConfig({ key, direction });
    };

    const filteredGames = games.filter(game =>
        game.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.metadata?.series?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedGames = [...filteredGames].sort((a, b) => {
        if (!sortConfig) return 0;

        const aValue = a[sortConfig.key as keyof Game];
        const bValue = b[sortConfig.key as keyof Game];

        if (aValue && bValue && aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue && bValue && aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const handleEditGame = (game: Game) => {
        setEditingGame(game);
    };

    const handleSaveGame = async () => {
        if (!editingGame) return;

        try {
            setLoading(true);
            await client.models.Game.update({
                id: editingGame.id,
                title: editingGame.title,
                metadata: JSON.stringify(editingGame.metadata || {}),
            });

            setEditingGame(null);
            loadGames();

            showToast(`Saved changes to "${editingGame.title}"`, 'success');
        } catch (err) {
            setError('Failed to update game. Please try again.');
            console.error('Error updating game:', err);
            showToast('Failed to update game', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGame = async (gameId: string, gameTitle: string) => {
        if (!confirm(`Are you sure you want to delete "${gameTitle}"? This action cannot be undone and will remove all associated save states.`)) {
            return;
        }

        try {
            setLoading(true);
            await client.models.Game.delete({ id: gameId });
            loadGames();
            showToast(`Deleted "${gameTitle}"`, 'success');
        } catch (err) {
            setError('Failed to delete game. Please try again.');
            console.error('Error deleting game:', err);
            showToast('Failed to delete game', 'error');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            key: 'title',
            header: 'Game',
            sortable: true,
            render: (game: Game) => (
                <Flex $alignItems="center" $gap="0.75rem">
                    {game.img && (game.img.slice(0, 4) === 'http' || imageUrlsByGameId[game.id]) && (
                        <Image
                            src={game.img.slice(0, 4) === 'http' ? game.img : imageUrlsByGameId[game.id]}
                            alt={game.title}
                            className={styles.gameImage}
                            width={32}
                            height={32}
                        />
                    )}
                    <Flex $direction="column">
                        <Text $fontWeight="medium">{game.title}</Text>
                        {game.metadata?.series && (
                            <Text $fontSize="sm" variation="secondary">
                                {game.metadata.series}
                            </Text>
                        )}
                    </Flex>
                </Flex>
            )
        },
        {
            key: 'owner',
            header: 'Owner',
            sortable: true,
            render: (game: Game) => {
                const sub = game.owner;
                const username = usernameBySub[sub];
                return (
                    <Text $fontSize="sm" style={{ fontFamily: 'monospace' }}>
                        {username || `${sub.substring(0, 8)}...`}
                    </Text>
                );
            }
        },
        {
            key: 'metadata',
            header: 'Details',
            sortable: false,
            render: (game: Game) => (
                <Flex $direction="column" $gap="0.25rem">
                    {game.metadata?.generation && (
                        <Text $fontSize="sm">Gen: {game.metadata.generation}</Text>
                    )}
                    {game.metadata?.releaseDate && (
                        <Text $fontSize="sm" variation="secondary">
                            {new Date(game.metadata.releaseDate).getFullYear()}
                        </Text>
                    )}
                    {game.metadata?.description && (
                        <Text $fontSize="sm" variation="secondary">
                            {game.metadata.description.substring(0, 50)}...
                        </Text>
                    )}
                </Flex>
            )
        },
        {
            key: 'filePath',
            header: 'File',
            sortable: false,
            render: (game: Game) => (
                <Text $fontSize="sm" style={{ fontFamily: 'monospace' }}>
                    {game.filePath.split('/').pop()}
                </Text>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            sortable: false,
            render: (game: Game) => (
                <Flex $gap="0.5rem">
                    <button
                        onClick={() => handleEditGame(game)}
                        className={`${styles.actionButton} edit`}
                        title="Edit game"
                    >
                        <FaEdit />
                    </button>
                    <button
                        onClick={() => handleDeleteGame(game.id, game.title)}
                        className={`${styles.actionButton} destructive`}
                        title="Delete game"
                    >
                        <FaTrash />
                    </button>
                </Flex>
            )
        }
    ];

    return (
        <div className={styles.gamesManagement}>
            <Flex $justifyContent="space-between" $alignItems="center" className={styles.adminHeader}>
                <Heading as="h2">Games Management</Heading>
                <Flex $gap="1rem" $alignItems="center" className={styles.adminActions}>
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search games..."
                    />
                    <Text $fontSize="sm" variation="secondary">
                        Total: {games.length} games
                    </Text>
                </Flex>
            </Flex>

            {error && (
                <Alert $variation="error" isDismissible>
                    {error}
                </Alert>
            )}

            <DataTable
                data={sortedGames}
                columns={columns}
                loading={loading}
                emptyMessage="No games found"
                onSort={handleSort}
                currentSort={sortConfig}
            />

            {/* Edit Game Modal */}
            <AdminModal
                isOpen={!!editingGame}
                onClose={() => setEditingGame(null)}
                title={`Edit Game: ${editingGame?.title}`}
                onSave={handleSaveGame}
                loading={loading}
                size="large"
            >
                {editingGame && (
                    <Flex $direction="column" $gap="1rem">
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Title</label>
                                <input
                                    type="text"
                                    value={editingGame.title}
                                    onChange={(e) => setEditingGame({...editingGame, title: e.target.value})}
                                    className={styles.formInput}
                                />
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Series</label>
                                <input
                                    type="text"
                                    value={editingGame.metadata?.series || ''}
                                    onChange={(e) => setEditingGame({
                                        ...editingGame,
                                        metadata: {...editingGame.metadata, series: e.target.value}
                                    })}
                                    className={styles.formInput}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Generation</label>
                                <input
                                    type="text"
                                    value={editingGame.metadata?.generation || ''}
                                    onChange={(e) => setEditingGame({
                                        ...editingGame,
                                        metadata: {...editingGame.metadata, generation: e.target.value}
                                    })}
                                    className={styles.formInput}
                                />
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Release Date</label>
                                <input
                                    type="date"
                                    value={editingGame.metadata?.releaseDate?.split('T')[0] || ''}
                                    onChange={(e) => setEditingGame({
                                        ...editingGame,
                                        metadata: {...editingGame.metadata, releaseDate: e.target.value}
                                    })}
                                    className={styles.formInput}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Owner ID</label>
                                <input
                                    type="text"
                                    value={editingGame.owner}
                                    disabled
                                    className={`${styles.formInput} ${styles.disabled}`}
                                    title="Cannot change owner"
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Description</label>
                            <textarea
                                value={editingGame.metadata?.description || ''}
                                onChange={(e) => setEditingGame({
                                    ...editingGame,
                                    metadata: {...editingGame.metadata, description: e.target.value}
                                })}
                                className={styles.formInput}
                                rows={3}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>File Path</label>
                            <input
                                type="text"
                                value={editingGame.filePath}
                                disabled
                                className={`${styles.formInput} ${styles.disabled}`}
                                title="File path cannot be changed"
                            />
                        </div>
                    </Flex>
                )}
            </AdminModal>
        </div>
    );
}
