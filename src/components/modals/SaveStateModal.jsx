import React, { useState } from 'react';
import { uploadImageToS3 } from '../../utils/saveLoad';

function SaveStateModal({ isOpen, onClose, onConfirm, initialData, currentROM }) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [imageFile, setImageFile] = useState(initialData?.img || '');

    const handleSubmit = async () => {
        let imageS3Key = initialData?.img || '';

        if (imageFile) {
            // Handle file upload to S3 and get the key
            if (imageFile.type.startsWith('image/')) {
                const fileType = imageFile.name.split('.').pop();
                const imagePath = `${currentROM.title}/saves/${title}.${fileType}`;
                imageS3Key = await uploadImageToS3(imageFile, imagePath);
            }
        }

        const saveStateData = {
            title,
            description,
            img: imageS3Key
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
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={handleSubmit}>Save</button>
                </div>
            </div>
        </div>
    );
}

export default SaveStateModal;
