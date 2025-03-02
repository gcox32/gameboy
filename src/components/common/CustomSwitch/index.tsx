import React from 'react';
import styles from './styles.module.css';

interface CustomSwitchProps {
    label: string;
    isChecked: boolean;
    onChange: () => void;
}

const CustomSwitch = ({ label, isChecked, onChange }: CustomSwitchProps) => {
    return (
        <div className={styles.switchContainer}>
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