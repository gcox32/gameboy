import styles from './styles.module.css';

export default function DPad({ className }: { className?: string }) {
    return (
        <div id={'dpad'} className={`${styles.dpad} ${className}`}>
            <div id={'dpadUp'} className={`${styles.top} ${styles.element} ${styles.up} ${styles.arrow}`}></div>
            <div id={'dpadLeft'} className={`${styles.left} ${styles.element} ${styles.middle} ${styles.arrow}`}></div>
            <div id={'dpadDown'} className={`${styles.bottom} ${styles.element} ${styles.down} ${styles.arrow}`}></div>
            <div id={'dpadRight'} className={`${styles.right} ${styles.element} ${styles.middle} ${styles.arrow}`}></div>
            <div className={`${styles.element} ${styles.center} ${styles.middle}`}></div>
        </div>
    );
}