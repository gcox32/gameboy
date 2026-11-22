import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { blobReadUrl, withVersion } from '@/utils/blobUpload';
import { Download, Trash2, Upload } from 'lucide-react';
import BaseModal from '../BaseModal';
import CartridgeIcon from '@/components/icons/CartridgeIcon';
import { Alert } from '@/components/ui';
import { downloadSav } from '@/utils/downloadSav';
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
    /** Turns a cartridge's .sav into a new save. Leave out to hide importing. */
    onImport?: (file: File) => Promise<unknown>;
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

function LoadStateModal({ isOpen, onClose, saveStates, onConfirm, onDelete, activeSaveId, onImport }: LoadStateModalProps) {
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            // The server deletes the save's file and screenshot along with it
            const res = await fetch(`/api/save-states/${save.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            await onDelete?.();
            setConfirmingDeleteId(null);
        } catch (err) {
            console.error('Error deleting save state:', err);
            setError('Failed to delete this save. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDownload = async (save: SaveStateModel) => {
        try {
            setDownloadingId(save.id ?? null);
            setError(null);
            await downloadSav(save);
        } catch (err) {
            console.error('Error downloading save file:', err);
            setError('Failed to download this save. Please try again.');
        } finally {
            setDownloadingId(null);
        }
    };

    const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Cleared so choosing the same file again still fires a change
        e.target.value = '';
        if (!file || !onImport) return;
        try {
            setIsImporting(true);
            setError(null);
            await onImport(file);
        } catch (err) {
            console.error('Error importing save file:', err);
            setError(err instanceof Error && err.message ? err.message : 'Failed to import this save. Please try again.');
        } finally {
            setIsImporting(false);
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
                                            <img src={withVersion(blobReadUrl(save.img), save.updatedAt)} alt="" />
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

                                <button
                                    type="button"
                                    className={styles.downloadButton}
                                    title="Download .sav"
                                    aria-label={`Download ${save.title} as a .sav file`}
                                    onClick={() => handleDownload(save)}
                                    disabled={downloadingId === save.id}
                                >
                                    <Download size={16} />
                                </button>

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

            {onImport && (
                <div className={styles.importBar}>
                    <button
                        type="button"
                        className={paper.secondaryButton}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                    >
                        <Upload size={14} aria-hidden />
                        {isImporting ? 'Importing…' : 'Import .sav'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".sav,.srm,application/octet-stream"
                        className={styles.importInput}
                        onChange={handleImportFile}
                        tabIndex={-1}
                        aria-hidden
                    />
                </div>
            )}
        </BaseModal>
    );
}

export default LoadStateModal;
