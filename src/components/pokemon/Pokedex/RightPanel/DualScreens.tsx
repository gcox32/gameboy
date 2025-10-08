import styles from './styles.module.css';

export default function DualScreens() {
    return (
        <div className={styles.dualScreens}>
            <div className={styles.dualScreen}></div>
            <div className={styles.dualScreen}></div>
        </div>
    );
}