import styles from './styles.module.css';


export default function Divider() {
    return (
        <div className={styles.divider}>
            <div className={styles.gap} />
            <div className={styles.hinge} />
            <div className={styles.gap} />
            <div className={styles.hinge} />
            <div className={styles.gap} />
            <div className={styles.hinge} />
            <div className={styles.gap} />
        </div>
    );
}