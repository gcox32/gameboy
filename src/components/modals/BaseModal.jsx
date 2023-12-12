import React from "react";

function BaseModal({ isOpen, onClose, children, className }) {
    if (!isOpen) return null;

    return (
        <div className="modal">
            <div className="modal-overlay" onClick={onClose}></div>
            <div className={`modal-content ${className}`}>
                <button onClick={onClose} className="close-modal">&times;</button>
                { children }
            </div>
        </div>
    );
}

export default BaseModal