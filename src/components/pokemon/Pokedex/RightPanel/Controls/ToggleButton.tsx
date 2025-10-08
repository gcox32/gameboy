import styles from './styles.module.css';

interface ToggleButtonProps {
    onClick: () => void;
}

export default function ToggleButton({ onClick }: ToggleButtonProps) {
    return (
        <div className={styles.toggleButton} onClick={onClick}></div>
    );
}