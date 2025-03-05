'use client';

import styles from '../styles.module.css';

export default function ResetPassword() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Reset Password</h1>
            <p className={styles.paragraph}>Enter your email to receive a password reset link.</p>
            <form className={styles.form}>
                <input
                    type="email"
                    placeholder="Email"
                    required
                    className={styles.input}
                />
                <button type="submit" className={styles.button}>Send Reset Link</button>
            </form>
        </div>
    );
}
