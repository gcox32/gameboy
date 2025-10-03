'use client';

import styles from '../styles.module.css';
import buttons from '@/styles/buttons.module.css';

export default function NewPassword() {
    return (
        <div className={`${styles.container} ${buttons.buttonGroup}`}>
            <h1 className={styles.title}>Set New Password</h1>
            <p className={styles.paragraph}>You need to set a new password.</p>
            <form className={styles.form}>
                <input
                    type="password"
                    placeholder="New Password"
                    required
                    className={styles.input}
                />
                <input
                    type="password"
                    placeholder="Confirm New Password"
                    required
                    className={styles.input}
                />
                <button type="submit" className={buttons.primaryButton} style={{ margin: '0 auto' }}>Submit</button>
            </form>
        </div>
    );
}
