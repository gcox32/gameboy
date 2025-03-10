import React, { useState, useEffect } from 'react';
import { Flex, Button } from '@aws-amplify/ui-react';
import styles from '../styles.module.css';
import { ImageUpload } from '@/components/common/ImageUpload';
import { getS3Url } from '@/utils/saveLoad';
interface SaveStateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (saveStateData: any) => void;
    initialData: any;
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
            imgFile: imageFile
        };

        console.log('Submitting save state with data:', saveStateData);
        onConfirm(saveStateData);
        onClose();
        setTitle('');
        setDescription('');
        setImageFile(null);
    };

    const handleImageUpload = (file: File | string) => {
        setImageFile(file);
        setPreviewUrl(file as string);
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
                <Flex
                    direction="row"
                    gap="1rem"
                    justifyContent="center"
                >
                    <Button
                        variation="destructive"
                        onClick={onClose}
                        size="large"
                    >
                        Cancel
                    </Button>
                    <Button
                        variation="primary"
                        onClick={handleSubmit}
                        size="large"
                    >
                        Confirm
                    </Button>
                </Flex>
            </div>
        </div>
    );
}

export default SaveStateModal;
