import React, { useState } from 'react';
import { userPoolRegion } from '../../../config';
import {
    Flex,
    Button
} from '@aws-amplify/ui-react';

function SaveStateModal({ isOpen, onClose, onConfirm, initialData, currentROM, userId }) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [imageFile, setImageFile] = useState(initialData?.img || '');

    const handleSubmit = async () => {
        let imagePath = initialData?.img || '';

        if (imageFile) {
            // Handle file upload to S3 and get the key
            if (imageFile.type.startsWith('image/')) {
                const fileType = imageFile.name.split('.').pop();
                imagePath = `private/${userPoolRegion}:${userId}/games/${currentROM.id}/saveStates/SAVE_STATE_ID/${title}.${fileType}`;
            }
        }

        const saveStateData = {
            title: title,
            description: description,
            img: imagePath,
            imgFile: imageFile
        };

        onConfirm(saveStateData);
        onClose();
        setTitle('');
        setDescription('');
        setImageFile(null);
    };

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    if (!isOpen) return null;

    return (
        <div className="modal">
            <div onClick={onClose} className="modal-overlay"></div>
            <div className="modal-content" id="save-modal">
                <button onClick={onClose} className="close-modal">&times;</button>
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
                        confirm={false}
                    >
                        Cancel
                    </Button>
                    <Button
                        variation="primary"
                        onClick={handleSubmit}
                        size="large"
                        confirm={true}
                    >
                        Confirm
                    </Button>
                </Flex>
            </div>
        </div>
    );
}

export default SaveStateModal;
