import React from 'react';
import styles from './styles.module.css';

interface CustomSwitchProps {
    label: string;
    isChecked: boolean;
    onChange: () => void;
    className?: string;
}

const CustomSwitch = ({ label, isChecked, onChange, className }: CustomSwitchProps) => {
    return (
        <div className={`${styles.switchContainer} ${className}`}>
            <label>{label}</label>
            <button 
                className={`${styles.switch} ${isChecked ? styles.checked : ''}`}
                onClick={onChange}
                role="switch"
                aria-checked={isChecked}
            >
                <span className={styles.thumb} />
            </button>
        </div>
    );
};

export default CustomSwitch; 