import React from "react";
import styles from './styles.module.css';

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}

function BaseModal({ isOpen, onClose, children, className }: BaseModalProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.modal}>
            <div className={styles.modalOverlay} onClick={onClose}></div>
            <div className={`${styles.modalContent} ${className}`}>
                <button onClick={onClose} className={styles.closeModal}>&times;</button>
                { children }
            </div>
        </div>
    );
}

export default BaseModal