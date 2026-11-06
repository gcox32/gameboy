import { useState } from 'react';
import BaseModal from '../BaseModal';
import paper from '../paper.module.css';
import styles from './styles.module.css';

interface SaveConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveOver: () => Promise<void>;
    onSaveAsNew: () => void;
}

/** The save changed since this session loaded it, so nothing has been written yet */
function SaveConflictModal({ isOpen, onClose, onSaveOver, onSaveAsNew }: SaveConflictModalProps) {
    const [saving, setSaving] = useState(false);

    const handleSaveOver = async () => {
        setSaving(true);
        try {
            await onSaveOver();
        } finally {
            setSaving(false);
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={saving ? () => {} : onClose}
            ariaLabel="This save has changed"
            size="sm"
            className={`${paper.modalContent} ${paper.paperModal}`}
        >
            <h2 className={paper.modalTitle}>This save has changed</h2>
            <div className={styles.form}>
                <p>
                    It was changed after you loaded it, in Oak&apos;s Lab or another tab. Your game hasn&apos;t been saved yet.
                </p>
                <p>
                    Saving over it undoes those changes, so any Pokémon moved in the meantime could end up duplicated or lost.
                </p>
                <div className={styles.formActions}>
                    <button type="button" className={paper.secondaryButton} onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="button" className={paper.secondaryButton} onClick={handleSaveOver} disabled={saving}>
                        {saving ? 'Saving...' : 'Save over it'}
                    </button>
                    <button type="button" className={paper.primaryButton} onClick={onSaveAsNew} disabled={saving}>Save as new</button>
                </div>
            </div>
        </BaseModal>
    );
}

export default SaveConflictModal;
