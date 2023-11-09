import React from "react";

function ConfirmModal({ isOpen, onClose, onConfirm, children, skipConfirmation, toggleSkipConfirmation }) {
    if (!isOpen) return null;

    return (
        <div className="modal">
            <div onClick={onClose} className="modal-overlay"></div>
            <div className="modal-content">
                <button onClick={onClose} className="close-modal" >&times;</button>
                {/* <h2 className="modal-title">Confirm Modal</h2> */}
                <h3 className="h3">{children}</h3>
                <div className="modal-options-buttons">
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={onConfirm}>Confirm</button>
                </div>
                <div className="remove-confirm">
                    <input
                        type="checkbox"
                        checked={skipConfirmation}
                        onChange={toggleSkipConfirmation}
                    />
                    <p>Don't ask me again</p>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal