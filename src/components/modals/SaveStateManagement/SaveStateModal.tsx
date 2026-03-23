import { useState, useEffect } from 'react';
import BaseModal from '../BaseModal';
import { Flex, TextField, TextAreaField } from '@/components/ui';
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
        onConfirm({
            title,
            description,
            img: initialData?.img || '',
            imgFile: imageFile as unknown as File
        });
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

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Save State" size="sm">
            <Flex $direction="column" $gap="1.25rem" $padding="1.5rem">
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
                <ImageUpload onChange={handleImageUpload} value={previewUrl} />

                <div className={buttons.buttonGroup} style={{ flexDirection: 'row' }}>
                    <button className={buttons.retroButton} onClick={onClose}>Cancel</button>
                    <button className={buttons.retroButton} onClick={handleSubmit}>Confirm</button>
                </div>
            </Flex>
        </BaseModal>
    );
}

export default SaveStateModal;
