import React, { useState } from 'react';
import {
    Flex,
    Button
} from '@aws-amplify/ui-react';
import styles from './styles.module.css';

interface SaveStateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (saveStateData: any) => void;
    initialData: any;
    currentROM: any;
    userId: string;
}

function SaveStateModal({ isOpen, onClose, onConfirm, initialData, currentROM, userId }: SaveStateModalProps) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [imageFile, setImageFile] = useState(initialData?.img || '');

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            console.log('File selected:', file);
            setImageFile(file);
        } else {
            console.error('Invalid file type');
            setImageFile(null);
        }
    };

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
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
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
