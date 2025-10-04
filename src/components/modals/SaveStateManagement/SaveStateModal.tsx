import React, { useState, useEffect } from 'react';
import styles from '../styles.module.css';
import { ImageUpload } from '@/components/common/ImageUpload';
import { getS3Url } from '@/utils/saveLoad';
import buttons from '@/styles/buttons.module.css';

export interface PartialSaveStateModel {
    title?: string;
    description?: string;
    img?: string;
    imgFile?: File;
}

interface SaveStateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (saveStateData: PartialSaveStateModel) => void;
    initialData: PartialSaveStateModel;
}

function SaveStateModal({ isOpen, onClose, onConfirm, initialData }: SaveStateModalProps) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [imageFile, setImageFile] = useState(initialData?.img || '');
    const [previewUrl, setPreviewUrl] = useState(initialData?.img || '');

    const handleSubmit = async () => {
        const saveStateData = {
            title: title,
            description: description,
            img: initialData?.img || '',
            imgFile: imageFile as unknown as File
        };

        console.log('Submitting save state with data:', saveStateData);
        onConfirm(saveStateData);
        onClose();
        setTitle('');
        setDescription('');
        setImageFile('');
    };

    const handleImageUpload = (file: File | string) => {
        setImageFile(file as unknown as string);
        setPreviewUrl(file as unknown as string);
    };

    useEffect(() => {
        const loadImageUrl = async () => {
            if (initialData?.img) {
                const url = await getS3Url(initialData.img);
                setPreviewUrl(url);
            }
        };
        loadImageUrl();
    }, [initialData?.img]);

    if (!isOpen) return null;

    return (
        <div className={styles.modal}>
            <div onClick={onClose} className={styles.modalOverlay}></div>
            <div className={styles.modalContent} id={styles.saveModal}>
                <button onClick={onClose} className={styles.closeModal}>&times;</button>
                <h2>Save Game</h2>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter title"
                />
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter description"
                />
                <ImageUpload
                    onChange={handleImageUpload}
                    value={previewUrl}
                />
                <div className={buttons.buttonGroup} style={{ marginTop: '1rem', flexDirection: 'row' }}>
                    <button
                        className={buttons.warningButton}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className={buttons.primaryButton}
                        onClick={handleSubmit}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SaveStateModal;
