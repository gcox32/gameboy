import { useState } from 'react';
import { createPortal } from 'react-dom';
import BaseModal from '@/components/modals/BaseModal';
import ConfirmModal from '@/components/modals/utilities/ConfirmModal';
import { CartridgeShelf } from '@/components/modals/CartridgePicker';
import paper from '@/components/modals/paper.module.css';
import { Alert, Loader, useToast } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useGames } from '@/contexts/GamesContext';
import { getAppShell } from '@/lib/appShell';
import { uploadBlob } from '@/utils/blobUpload';
import { gameBlobDir } from '@/utils/blobPaths';
import { GameModel } from '@/types';
import styles from './styles.module.css';
import ImportGame from './ImportGame';
import GameEditForm from './GameEditForm';

interface GameManagementProps {
    isOpen: boolean;
    onClose: () => void;
    selectedGame: GameModel | null;
    onSelect: (game: GameModel) => void;
    /** When given, stops a game being chosen and says why. Editing stays available. */
    chooseDisabledReason?: string;
    onGameEdited?: (updatedGame: GameModel) => void;
}

/** The player's game library: choose, edit, import and delete games */
export default function GameManagement({
    isOpen,
    onClose,
    selectedGame,
    onSelect,
    chooseDisabledReason,
    onGameEdited,
}: GameManagementProps) {
    const auth = useAuth();
    if (!auth) throw new Error('Auth context not available');
    const { user } = auth;
    const { showToast } = useToast();

    const { games, isLoading, error: gamesError, refreshGames } = useGames();
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [editingGame, setEditingGame] = useState<GameModel | null>(null);
    // The game to return to on the shelf after editing, rather than the selected one
    const [lastEditedId, setLastEditedId] = useState<string | null>(null);
    const [gameToDelete, setGameToDelete] = useState<GameModel | null>(null);
    const [skipDeleteConfirmation, setSkipDeleteConfirmation] = useState(false);

    const error = updateError ?? gamesError;

    const handleClose = () => {
        setIsImporting(false);
        setEditingGame(null);
        setLastEditedId(null);
        setUpdateError(null);
        onClose();
    };

    const handleEditGame = async (gameData: GameModel & { imageFile?: File | null }) => {
        try {
            setIsUpdating(true);
            setUpdateError(null);

            let imagePath = gameData.img || '';
            if (gameData.imageFile) {
                const identity = user?.email || user?.userId || '';
                const ext = gameData.imageFile.name.split('.').pop() ?? 'jpg';
                const coverPath = `${gameBlobDir(identity, gameData.title, gameData.id)}/cover.${ext}`;
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

            onGameEdited?.(updated);
            await refreshGames();
            setEditingGame(null);
            showToast(`Saved changes to "${gameData.title}"`, 'success');
        } catch (err) {
            console.error(err);
            setUpdateError('Failed to update game. Please try again.');
            showToast('Failed to update game', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteGame = async (game: GameModel) => {
        try {
            setIsUpdating(true);
            setUpdateError(null);
            const res = await fetch(`/api/games/${game.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            setGameToDelete(null);
            await refreshGames();
            setEditingGame(null);
            showToast(`Deleted "${game.title}"`, 'success');
        } catch (err) {
            console.error(err);
            setGameToDelete(null);
            setUpdateError('Failed to delete game. Please try again.');
            showToast('Failed to delete game', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const renderContent = () => {
        if (isImporting) {
            return (
                <div className={styles.modalBody}>
                    <ImportGame
                        userId={user?.userId}
                        userEmail={user?.email}
                        onSuccess={() => { setIsImporting(false); refreshGames(); }}
                        onCancel={() => setIsImporting(false)}
                    />
                </div>
            );
        }

        if (editingGame) {
            return (
                <div className={styles.modalBody}>
                    <button
                        className={styles.backButton}
                        onClick={() => { setUpdateError(null); setEditingGame(null); }}
                        type="button"
                    >
                        ← Library
                    </button>
                    <GameEditForm
                        game={editingGame}
                        gameImgRef={editingGame.img ?? ''}
                        onSave={handleEditGame}
                        onDelete={(game) => {
                            if (skipDeleteConfirmation) handleDeleteGame(game);
                            else setGameToDelete(game);
                        }}
                    />
                </div>
            );
        }

        return (
            <CartridgeShelf
                games={games}
                onSelect={onSelect}
                selectedFilePath={selectedGame?.filePath}
                initialGameId={lastEditedId ?? selectedGame?.id}
                emptyMessage="No games yet. Import a ROM to get started."
                chooseDisabledReason={chooseDisabledReason}
                renderActions={(game) => (
                    <button
                        type="button"
                        className={paper.secondaryButton}
                        onClick={() => { setLastEditedId(game.id); setEditingGame(game); }}
                    >
                        Edit
                    </button>
                )}
                footer={
                    <button type="button" className={paper.secondaryButton} onClick={() => setIsImporting(true)}>
                        + Import Game
                    </button>
                }
            />
        );
    };

    if (!isOpen) return null;

    const modalTitle = isImporting ? 'Import Game' : editingGame ? editingGame.title : 'Game Library';

    return createPortal(
        <>
            <BaseModal
                isOpen={isOpen}
                onClose={handleClose}
                ariaLabel={modalTitle}
                size="lg"
                className={`${paper.modalContent} ${paper.paperModal}`}
            >
                <h2 className={paper.modalTitle}>{modalTitle}</h2>
                {error && <div className={styles.error}><Alert variation="error">{error}</Alert></div>}
                {isLoading || isUpdating ? <div className={styles.modalBody}><Loader variation="linear" /></div> : renderContent()}
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
        </>,
        // At the top of the shell, so it sits above the nav and stays visible in fullscreen
        getAppShell() ?? document.body
    );
}
