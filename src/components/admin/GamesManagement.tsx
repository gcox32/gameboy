'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { blobReadUrl } from '@/utils/blobUpload';
import { Flex, Text, Alert } from '@/components/ui';
import { useGames } from '@/contexts/GamesContext';
import { GameModel } from '@/types';
import DataTable, { Column } from './DataTable';
import AdminModal from './AdminModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import SearchInput from './SearchInput';
import { useAdminTable, ensureOk, fetchUsernames } from './useAdminTable';
import styles from '@/styles/admin.module.css';

type GameRow = GameModel & { ownerName?: string };

async function loadGames(): Promise<GameRow[]> {
    const [res, names] = await Promise.all([
        fetch('/api/games?all=true').then((r) => ensureOk(r, 'Failed to load games')),
        fetchUsernames(),
    ]);
    const games: GameModel[] = await res.json();
    return games.map((g) => ({ ...g, ownerName: names[g.userId] }));
}

const searchText = (g: GameRow) => [g.title, g.metadata?.series, g.ownerName];
const shortId = (id?: string) => (id ? `${id.substring(0, 8)}…` : '');

export default function GamesManagement() {
    const table = useAdminTable({ load: loadGames, searchText });
    const [editingGame, setEditingGame] = useState<GameRow | null>(null);
    const [deletingGame, setDeletingGame] = useState<GameRow | null>(null);
    // An admin's own games can be among those changed here
    const { refreshGames } = useGames();

    const setMetadata = (patch: Partial<NonNullable<GameModel['metadata']>>) =>
        setEditingGame((g) => g && { ...g, metadata: { ...g.metadata, ...patch } });

    const saveGame = async () => {
        if (!editingGame) return;
        const { id, title, metadata } = editingGame;
        const ok = await table.run(
            async () => ensureOk(await fetch(`/api/games/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, metadata }),
            }), 'Update failed'),
            `Saved changes to "${title}"`,
            'Failed to update game',
        );
        if (ok) {
            setEditingGame(null);
            refreshGames();
        }
    };

    const deleteGame = async () => {
        if (!deletingGame) return;
        const { id, title } = deletingGame;
        const ok = await table.run(
            async () => ensureOk(await fetch(`/api/games/${id}`, { method: 'DELETE' }), 'Delete failed'),
            `Deleted "${title}"`,
            'Failed to delete game',
        );
        setDeletingGame(null);
        if (ok) refreshGames();
    };

    const columns: Column<GameRow>[] = [
        {
            key: 'title',
            header: 'Game',
            sortValue: (g) => g.title,
            render: (g) => (
                <Flex $alignItems="center" $gap="0.75rem">
                    {g.img && (
                        <Image src={blobReadUrl(g.img)} alt={g.title} className={styles.gameImage} width={32} height={32} unoptimized />
                    )}
                    <Flex $direction="column">
                        <Text fontWeight="medium">{g.title}</Text>
                        {g.metadata?.series && <Text fontSize="sm" variation="secondary">{g.metadata.series}</Text>}
                    </Flex>
                </Flex>
            ),
        },
        {
            key: 'owner',
            header: 'Owner',
            sortValue: (g) => g.ownerName ?? g.userId,
            render: (g) => <Text fontSize="sm" className={styles.mono}>{g.ownerName || shortId(g.userId)}</Text>,
        },
        {
            key: 'details',
            header: 'Details',
            sortValue: (g) => g.metadata?.generation,
            render: (g) => (
                <Flex $direction="column" $gap="0.25rem">
                    {g.metadata?.generation && <Text fontSize="sm">Gen {g.metadata.generation}</Text>}
                    {g.metadata?.releaseDate && <Text fontSize="sm" variation="secondary">{new Date(g.metadata.releaseDate).getFullYear()}</Text>}
                    {g.metadata?.description && <Text fontSize="sm" variation="secondary">{g.metadata.description}</Text>}
                </Flex>
            ),
        },
        {
            key: 'file',
            header: 'File',
            render: (g) => <Text fontSize="sm" className={styles.mono}>{g.filePath.split('/').pop()}</Text>,
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (g) => (
                <Flex $gap="0.5rem">
                    <button onClick={() => setEditingGame(g)} className={`${styles.actionButton} ${styles.edit}`} title="Edit game"><FaEdit /></button>
                    <button onClick={() => setDeletingGame(g)} className={`${styles.actionButton} ${styles.destructive}`} title="Delete game"><FaTrash /></button>
                </Flex>
            ),
        },
    ];

    return (
        <div className={styles.managementContainer}>
            <div className={styles.tableToolbar}>
                <SearchInput value={table.searchTerm} onChange={table.setSearchTerm} placeholder="Search games..." />
            </div>

            {table.error && <Alert variation="error" onDismiss={() => table.setError(null)}>{table.error}</Alert>}

            <DataTable data={table.rows} columns={columns} rowKey={(g) => g.id} loading={table.loading} emptyMessage="No games found" />

            <div className={styles.tableFooter}>
                <Text fontSize="sm" variation="secondary">Total: {table.items.length} games</Text>
            </div>

            <AdminModal
                isOpen={!!editingGame}
                onClose={() => setEditingGame(null)}
                title={`Edit Game: ${editingGame?.title}`}
                onSave={saveGame}
                loading={table.saving}
                size="large"
            >
                {editingGame && (
                    <Flex $direction="column" $gap="1rem">
                        <div className={styles.formGroup}>
                            <label htmlFor="game-title" className={styles.formLabel}>Title</label>
                            <input id="game-title" type="text" value={editingGame.title} onChange={(e) => setEditingGame({ ...editingGame, title: e.target.value })} className={styles.formInput} />
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="game-series" className={styles.formLabel}>Series</label>
                                <input id="game-series" type="text" value={editingGame.metadata?.series || ''} onChange={(e) => setMetadata({ series: e.target.value })} className={styles.formInput} />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="game-generation" className={styles.formLabel}>Generation</label>
                                {/* Stored as a number; Oak's Lab only opens Gen 1 games */}
                                <select id="game-generation" value={editingGame.metadata?.generation || ''} onChange={(e) => setMetadata({ generation: e.target.value })} className={styles.formInput}>
                                    <option value="">Not set</option>
                                    <option value="1">Gen 1</option>
                                    <option value="2">Gen 2</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="game-release" className={styles.formLabel}>Release Date</label>
                                <input id="game-release" type="date" value={editingGame.metadata?.releaseDate?.split('T')[0] || ''} onChange={(e) => setMetadata({ releaseDate: e.target.value })} className={styles.formInput} />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="game-owner" className={styles.formLabel}>Owner</label>
                                <input id="game-owner" type="text" value={editingGame.ownerName ? `${editingGame.ownerName} (${editingGame.userId})` : editingGame.userId} disabled className={styles.formInput} />
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="game-description" className={styles.formLabel}>Description</label>
                            <textarea id="game-description" value={editingGame.metadata?.description || ''} onChange={(e) => setMetadata({ description: e.target.value })} className={styles.formInput} rows={3} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="game-file" className={styles.formLabel}>File Path</label>
                            <input id="game-file" type="text" value={editingGame.filePath} disabled className={styles.formInput} />
                        </div>
                    </Flex>
                )}
            </AdminModal>

            <ConfirmDeleteModal
                isOpen={!!deletingGame}
                onClose={() => setDeletingGame(null)}
                onConfirm={deleteGame}
                title="Delete Game"
                message="Delete this game and all of its saves and files? This can't be undone."
                itemName={deletingGame?.title}
                loading={table.saving}
            />
        </div>
    );
}
