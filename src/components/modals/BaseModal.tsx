import { useEffect, ReactNode } from "react";
import styles from './styles.module.css';

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
    title?: string;
    size?: 'sm' | 'md' | 'lg';
    lightCloseButton?: boolean;
}

function BaseModal({ isOpen, onClose, children, className, title, size = 'md', lightCloseButton }: BaseModalProps) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClass = size === 'sm' ? styles.sizeSm : size === 'lg' ? styles.sizeLg : styles.sizeMd;

    return (
        <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title}>
            <div className={styles.modalOverlay} onClick={onClose} />
            <div className={`${styles.modalContent} ${sizeClass} ${className || ''}`}>
                {title ? (
                    <div className={styles.modalHeader}>
                        <span className={styles.modalTitle}>{title}</span>
                        <button onClick={onClose} className={styles.closeModal} aria-label="Close">✕</button>
                    </div>
                ) : (
                    <button
                        onClick={onClose}
                        className={`${styles.closeModalFloat} ${lightCloseButton ? styles.light : ''}`}
                        aria-label="Close"
                    >
                        &times;
                    </button>
                )}
                <div className={styles.modalBody}>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default BaseModal;