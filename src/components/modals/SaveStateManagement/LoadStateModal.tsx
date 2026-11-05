import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import BaseModal from '../BaseModal';
import CartridgeIcon from '@/components/icons/CartridgeIcon';
import { Alert } from '@/components/ui';
import { deleteBlob } from '@/utils/blobUpload';
import { SaveStateModel } from '@/types';
import paper from '../paper.module.css';
import styles from './styles.module.css';

interface LoadStateModalProps {
    isOpen: boolean;
    onClose: () => void;
    saveStates: SaveStateModel[];
    onConfirm: (saveState: SaveStateModel) => void;
    /** Leave out to hide deleting */
    onDelete?: () => void | Promise<void>;
    /** The save the running game came from. It's marked, and can't be deleted. */
    activeSaveId?: string;
}

const formatLastSaved = (dateString: string) => {
    const date = new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
    return `Last saved ${date}`;
};

const getTime = (dateString?: string) => (dateString ? new Date(dateString).getTime() : 0);

function LoadStateModal({ isOpen, onClose, saveStates, onConfirm, onDelete, activeSaveId }: LoadStateModalProps) {
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sortedSaves = useMemo(
        () => [...saveStates].sort((a, b) => getTime(b.updatedAt) - getTime(a.updatedAt)),
        [saveStates]
    );

    useEffect(() => {
        if (isOpen) return;
        setConfirmingDeleteId(null);
        setError(null);
    }, [isOpen]);

    const handleDelete = async (save: SaveStateModel) => {
        try {
            setIsDeleting(true);
            setError(null);
            const res = await fetch(`/api/save-states/${save.id}`, { method: 'DELETE' });
            // The files go only once the record has, so a failure never leaves a save without its data
            if (!res.ok) throw new Error('Delete failed');
            await Promise.allSettled([
                deleteBlob(save.filePath),
                deleteBlob(save.img ?? ''),
            ]);
            await onDelete?.();
            setConfirmingDeleteId(null);
        } catch (err) {
            console.error('Error deleting save state:', err);
            setError('Failed to delete this save. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            ariaLabel="Load State"
            className={`${paper.modalContent} ${paper.paperModal}`}
        >
            <h2 className={paper.modalTitle}>Load State</h2>

            {error && <div className={styles.error}><Alert variation="error">{error}</Alert></div>}

            {sortedSaves.length === 0 ? (
                <p className={styles.empty}>No saves yet for this game.</p>
            ) : (
                <ul className={styles.saveList}>
                    {sortedSaves.map((save) => {
                        const isActive = !!activeSaveId && save.id === activeSaveId;
                        return (
                            <li key={save.id} className={styles.saveRow}>
                                <button type="button" className={styles.saveButton} onClick={() => onConfirm(save)}>
                                    <span className={styles.thumbnail}>
                                        {save.img ? (
                                            // Saves overwrite their screenshot at the same URL, so the version shows the latest
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={`${save.img}?v=${encodeURIComponent(save.updatedAt ?? '')}`} alt="" />
                                        ) : (
                                            <CartridgeIcon size={24} />
                                        )}
                                    </span>
                                    <span className={styles.saveDetails}>
                                        <span className={styles.saveTitle}>{save.title}</span>
                                        {save.description && <span className={styles.saveDescription}>{save.description}</span>}
                                        {save.updatedAt && <span className={styles.saveDate}>{formatLastSaved(save.updatedAt)}</span>}
                                    </span>
                                </button>

                                {isActive && <span className={styles.currentTag}>Current</span>}

                                {onDelete && !isActive && (
                                    confirmingDeleteId === save.id ? (
                                        <span className={styles.deleteConfirm}>
                                            <button
                                                type="button"
                                                className={paper.secondaryButton}
                                                onClick={() => setConfirmingDeleteId(null)}
                                                disabled={isDeleting}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className={paper.primaryButton}
                                                onClick={() => handleDelete(save)}
                                                disabled={isDeleting}
                                            >
                                                {isDeleting ? 'Deleting…' : 'Delete'}
                                            </button>
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            className={styles.deleteButton}
                                            title="Delete"
                                            aria-label={`Delete ${save.title}`}
                                            onClick={() => { setError(null); setConfirmingDeleteId(save.id ?? null); }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </BaseModal>
    );
}

export default LoadStateModal;
