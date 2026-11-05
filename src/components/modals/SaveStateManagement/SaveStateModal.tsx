import { useState, useEffect } from 'react';
import BaseModal from '../BaseModal';
import { TextField, TextAreaField } from '@/components/ui';
import paper from '../paper.module.css';
import styles from './styles.module.css';

export interface PartialSaveStateModel {
    title?: string;
    description?: string;
}

interface SaveStateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (saveStateData: PartialSaveStateModel) => void;
    initialData: PartialSaveStateModel;
}

function SaveStateModal({ isOpen, onClose, onConfirm, initialData }: SaveStateModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setTitle(initialData?.title || '');
        setDescription(initialData?.description || '');
    }, [isOpen, initialData]);

    const handleSubmit = () => {
        onConfirm({ title, description });
        onClose();
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            ariaLabel="Save State"
            size="sm"
            className={`${paper.modalContent} ${paper.paperModal}`}
        >
            <h2 className={paper.modalTitle}>Save State</h2>
            <div className={styles.form}>
                <TextField
                    label="Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Enter title"
                    orientation="vertical"
                />
                <TextAreaField
                    label="Description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Enter description"
                    rows={3}
                    orientation="vertical"
                />
                <div className={styles.formActions}>
                    <button type="button" className={paper.secondaryButton} onClick={onClose}>Cancel</button>
                    <button type="button" className={paper.primaryButton} onClick={handleSubmit} disabled={!title.trim()}>Confirm</button>
                </div>
            </div>
        </BaseModal>
    );
}

export default SaveStateModal;
