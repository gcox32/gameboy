import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './styles.module.css';

interface HideShowButtonProps {
    onClick: () => void;
    isPanelVisible: boolean;
    mobile?: boolean;
    className?: string;
}

const HideShowButton = ({ 
    onClick, 
    isPanelVisible, 
    mobile = false,
    className 
}: HideShowButtonProps) => {
    const Icon = isPanelVisible ? FaChevronLeft : FaChevronRight;
    
    return (
        <button
            onClick={onClick}
            className={`
                ${styles.toggleButton} 
                ${mobile ? styles.mobile : styles.desktop}
                ${isPanelVisible ? styles.visible : styles.hidden}
                ${className || ''}
            `}
            aria-label={isPanelVisible ? 'Hide Panel' : 'Show Panel'}
            aria-expanded={isPanelVisible}
        >
            <Icon className={styles.icon} />
        </button>
    );
};

export default HideShowButton;
