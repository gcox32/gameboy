import React from "react";
import OptionButton from "./OptionButton";

function ConfirmModal({ isOpen, onClose, onConfirm, children, skipConfirmation, toggleSkipConfirmation }) {
    if (!isOpen) return null;

    return (
        <div className="modal top">
            <div onClick={onClose} className="modal-overlay"></div>
            <div className="modal-content">
                <button onClick={onClose} className="close-modal" >&times;</button>
                {/* <h2 className="modal-title">Confirm Modal</h2> */}
                <h3 className="h3">{children}</h3>
                <div className="modal-options-buttons">
                    <OptionButton onClick={onClose} confirm={false} />
                    <OptionButton onClick={onConfirm} confirm={true}/>
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
