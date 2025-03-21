import React from 'react';
import styles from './styles.module.css';

interface CustomSliderProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step: number;
    className?: string;
}

const CustomSlider = ({ label, value, onChange, min, max, step, className }: CustomSliderProps) => {
    return (
        <div className={`${styles.sliderContainer} ${className}`}>
            <div className={styles.labelContainer}>
                <label>{label}</label>
                <span className={styles.value}>{value}x</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className={styles.slider}
            />
        </div>
    );
};

export default CustomSlider; 