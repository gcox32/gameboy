import React, { useState } from 'react';

function SaveStateModal({ isOpen, onClose, onConfirm, initialData }) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [img, setImg] = useState(initialData?.img || '');

    // This will be called when the user clicks the Save button
    const handleSubmit = () => {
        // Construct the save state object
        const saveStateData = {
            title,
            description,
            img
        };
        
        // Pass the save state data object to the onConfirm function provided by the parent
        onConfirm(saveStateData);
        
        // Close the modal
        onClose();
        
        // Optionally reset the modal's form fields
        setTitle('');
        setDescription('');
        setImg('');
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
                    type="text"
                    value={img}
                    onChange={(e) => setImg(e.target.value)}
                    placeholder="Enter image URL or base64"
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
