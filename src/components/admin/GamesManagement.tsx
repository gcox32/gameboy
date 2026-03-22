'use client';

import { useState, useEffect, useCallback } from 'react';
import { Flex, Text, Alert } from '@/components/ui';
import DataTable from './DataTable';
import AdminModal from './AdminModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import SearchInput from './SearchInput';
import styles from '@/styles/admin.module.css';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Image from 'next/image';
import { getUsernamesForSubs } from '@/utils/usernames';
import { useToast } from '@/components/ui';
import { GameModel } from '@/types';

export default function GamesManagement() {
    const [games, setGames] = useState<GameModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingGame, setEditingGame] = useState<GameModel | null>(null);
    const [deletingGame, setDeletingGame] = useState<GameModel | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [usernameBySub, setUsernameBySub] = useState<Record<string, string>>({});

    const { showToast } = useToast();

    const loadGames = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/games?all=true');
            if (!res.ok) throw new Error('Failed to load games');
            const data: GameModel[] = await res.json();
            setGames(data);

            const owners = data.map((g) => g.userId).filter(Boolean);
            if (owners.length > 0) {
                const mapping = await getUsernamesForSubs(owners);
                setUsernameBySub((prev) => ({ ...prev, ...mapping }));
            }
        } catch (err) {
            setError('Failed to load games. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadGames(); }, [loadGames]);

    const handleSort = (key: string, direction: 'asc' | 'desc') => setSortConfig({ key, direction });

    const filteredGames = games.filter(game =>
        game.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.metadata?.series?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedGames = [...filteredGames].sort((a, b) => {
        if (!sortConfig) return 0;
        const aVal = a[sortConfig.key as keyof GameModel] ?? '';
        const bVal = b[sortConfig.key as keyof GameModel] ?? '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSaveGame = async () => {
        if (!editingGame) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/games/${editingGame.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: editingGame.title, metadata: editingGame.metadata }),
            });
            if (!res.ok) throw new Error('Update failed');
            setEditingGame(null);
            loadGames();
            showToast(`Saved changes to "${editingGame.title}"`, 'success');
        } catch (err) {
            setError('Failed to update game. Please try again.');
            console.error(err);
            showToast('Failed to update game', 'error');
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteGame = async () => {
        if (!deletingGame) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/games/${deletingGame.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            showToast(`Deleted "${deletingGame.title}"`, 'success');
            setDeletingGame(null);
            await loadGames();
        } catch (err) {
            setError('Failed to delete game. Please try again.');
            console.error(err);
            showToast('Failed to delete game', 'error');
            setLoading(false);
        }
    };

    const columns = [
        {
            key: 'title',
            header: 'Game',
            sortable: true,
            render: (game: GameModel) => (
                <Flex $alignItems="center" $gap="0.75rem">
                    {game.img && (
                        <Image src={game.img} alt={game.title} className={styles.gameImage} width={32} height={32} />
                    )}
                    <Flex $direction="column">
                        <Text $fontWeight="medium">{game.title}</Text>
                        {game.metadata?.series && <Text $fontSize="sm" $variation="secondary">{game.metadata.series}</Text>}
                    </Flex>
                </Flex>
            )
        },
        {
            key: 'userId',
            header: 'Owner',
            sortable: true,
            render: (game: GameModel) => (
                <Text $fontSize="sm" style={{ fontFamily: 'monospace' }}>
                    {usernameBySub[game.userId] || `${game.userId?.substring(0, 8) ?? ''}...`}
                </Text>
            )
        },
        {
            key: 'metadata',
            header: 'Details',
            sortable: false,
            render: (game: GameModel) => (
                <Flex $direction="column" $gap="0.25rem">
                    {game.metadata?.generation && <Text $fontSize="sm">Gen: {game.metadata.generation}</Text>}
                    {game.metadata?.releaseDate && <Text $fontSize="sm" $variation="secondary">{new Date(game.metadata.releaseDate).getFullYear()}</Text>}
                    {game.metadata?.description && <Text $fontSize="sm" $variation="secondary">{game.metadata.description.substring(0, 50)}...</Text>}
                </Flex>
            )
        },
        {
            key: 'filePath',
            header: 'File',
            sortable: false,
            render: (game: GameModel) => (
                <Text $fontSize="sm" style={{ fontFamily: 'monospace' }}>{game.filePath.split('/').pop()}</Text>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            sortable: false,
            render: (game: GameModel) => (
                <Flex $gap="0.5rem">
                    <button onClick={() => setEditingGame(game)} className={`${styles.actionButton} edit`} title="Edit game"><FaEdit /></button>
                    <button onClick={() => setDeletingGame(game)} className={`${styles.actionButton} destructive`} title="Delete game"><FaTrash /></button>
                </Flex>
            )
        }
    ];

    return (
        <div className={styles.managementContainer}>
            <Flex $justifyContent="space-between" $alignItems="center" className={styles.tableToolbar}>
                <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search games..." />
                <div />
            </Flex>

            {error && <Alert $variation="error" isDismissible>{error}</Alert>}

            <DataTable data={sortedGames} columns={columns} loading={loading} emptyMessage="No games found" onSort={handleSort} currentSort={sortConfig} />

            <div className={styles.tableFooter}>
                <Text $fontSize="sm" $variation="secondary">Total: {games.length} games</Text>
            </div>

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
                                <input type="text" value={editingGame.title} onChange={(e) => setEditingGame({ ...editingGame, title: e.target.value })} className={styles.formInput} />
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Series</label>
                                <input type="text" value={editingGame.metadata?.series || ''} onChange={(e) => setEditingGame({ ...editingGame, metadata: { ...editingGame.metadata, series: e.target.value } })} className={styles.formInput} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Generation</label>
                                <input type="text" value={editingGame.metadata?.generation || ''} onChange={(e) => setEditingGame({ ...editingGame, metadata: { ...editingGame.metadata, generation: e.target.value } })} className={styles.formInput} />
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Release Date</label>
                                <input type="date" value={editingGame.metadata?.releaseDate?.split('T')[0] || ''} onChange={(e) => setEditingGame({ ...editingGame, metadata: { ...editingGame.metadata, releaseDate: e.target.value } })} className={styles.formInput} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Owner ID</label>
                                <input type="text" value={editingGame.userId} disabled className={`${styles.formInput} ${styles.disabled}`} />
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Description</label>
                            <textarea value={editingGame.metadata?.description || ''} onChange={(e) => setEditingGame({ ...editingGame, metadata: { ...editingGame.metadata, description: e.target.value } })} className={styles.formInput} rows={3} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>File Path</label>
                            <input type="text" value={editingGame.filePath} disabled className={`${styles.formInput} ${styles.disabled}`} />
                        </div>
                    </Flex>
                )}
            </AdminModal>

            <ConfirmDeleteModal
                isOpen={!!deletingGame}
                onClose={() => setDeletingGame(null)}
                onConfirm={confirmDeleteGame}
                title="Delete Game"
                message="Are you sure you want to delete this game? This action cannot be undone."
                itemName={deletingGame?.title}
                loading={loading}
            />
        </div>
    );
}
