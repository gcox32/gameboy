import React, { useState } from 'react';
import { uploadImageToS3 } from '../../utils/saveLoad';
import OptionButton from './OptionButton';
import { assetsEndpointPrivate, userPoolRegion } from '../../../config';

function SaveStateModal({ isOpen, onClose, onConfirm, initialData, currentROM, userId, s3ID }) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [imageFile, setImageFile] = useState(initialData?.img || '');

    const handleSubmit = async () => {
        let imagePath = initialData?.img || '';

        if (imageFile) {
            // Handle file upload to S3 and get the key
            if (imageFile.type.startsWith('image/')) {
                const fileType = imageFile.name.split('.').pop();
                imagePath = `private/${userPoolRegion}:${userId}/${currentROM.title}/${s3ID}/${title}.${fileType}`;
                await uploadImageToS3(imageFile, imagePath);
            }
        }

        const saveStateData = {
            title: title,
            description: description,
            img: imagePath
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
                <div className="modal-options-buttons">
                    <OptionButton onClick={onClose} confirm={false} />
                    <OptionButton onClick={handleSubmit} confirm={true} />
                </div>
            </div>
        </div>
    );
}

export default SaveStateModal;
