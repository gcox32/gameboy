import styles from './styles.module.css';

export default function BlueButtons() {
    return (
        <div className={styles.panelRow + ' ' + styles.blueButtons}>
            <div className={styles.blueButton} />
            <div className={styles.blueButton} />
            <div className={styles.blueButton} />
            <div className={styles.blueButton} />
            <div className={styles.blueButton} />
            <div className={styles.blueButton} />
            <div className={styles.blueButton} />
            <div className={styles.blueButton} />
            <div className={styles.blueButton} />
            <div className={styles.blueButton} />
        </div>
    );
}