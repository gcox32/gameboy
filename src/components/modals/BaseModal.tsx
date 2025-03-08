import React, { useEffect } from "react";
import styles from './styles.module.css';

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
    lightCloseButton?: boolean;
}

function BaseModal({ isOpen, onClose, children, className, lightCloseButton }: BaseModalProps) {

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
    
    if (!isOpen) return null;

    return (
        <div className={styles.modal}>
            <div className={styles.modalOverlay} onClick={onClose}></div>
            <div className={`${styles.modalContent} ${className}`}>
                <button onClick={onClose} className={`${styles.closeModal} ${lightCloseButton ? styles.light : ''}`}>
                    &times;
                </button>
                {children}
            </div>
        </div>
    );
}

export default BaseModal