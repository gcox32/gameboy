import React from "react";
import OptionButton from "./OptionButton";
import BaseModal from "./BaseModal";

function ConfirmModal({ isOpen, onClose, onConfirm, children, skipConfirmation, toggleSkipConfirmation }) {

    return (
        <BaseModal isOpen={isOpen} onClose={onClose}>
            <h3 className="h3">{children}</h3>
            <div className="modal-options-buttons">
                <OptionButton onClick={onClose} confirm={false} />
                <OptionButton onClick={onConfirm} confirm={true} />
            </div>
            <div className="remove-confirm">
                <input
                    type="checkbox"
                    checked={skipConfirmation}
                    onChange={toggleSkipConfirmation}
                />
                <p>Don't ask me again</p>
            </div>
        </BaseModal>
    );
}

export default ConfirmModal
