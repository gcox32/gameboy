'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import styles from '../styles.module.css';

export default function ResetPassword() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [username, setUsername] = useState('');
    const [confirmationCode, setConfirmationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isRequesting, setIsRequesting] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [step, setStep] = useState<'request' | 'confirm'>('request');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        const initialUsername = searchParams.get('username') || '';
        if (initialUsername) setUsername(initialUsername);
    }, [searchParams]);

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setIsRequesting(true);
        try {
            const output = await resetPassword({ username });
            // Most setups send an email with a code
            if (output.nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
                setMessage('We sent a verification code to your email. Enter it below with your new password.');
                setStep('confirm');
            } else {
                setMessage('Check your email for reset instructions.');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsRequesting(false);
        }
    };

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setIsConfirming(true);
        try {
            await confirmResetPassword({
                username,
                confirmationCode,
                newPassword,
            });
            router.push(`/login?reset=success`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Reset Password</h1>

            {step === 'request' && (
                <form onSubmit={handleRequest} className={styles.form}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className={styles.input}
                    />
                    <button type="submit" className={styles.button} disabled={isRequesting}>
                        {isRequesting ? 'Sending…' : 'Send Reset Code'}
                    </button>
                </form>
            )}

            {step === 'confirm' && (
                <form onSubmit={handleConfirm} className={styles.form}>
                    <input
                        type="text"
                        placeholder="Verification Code"
                        value={confirmationCode}
                        onChange={(e) => setConfirmationCode(e.target.value)}
                        required
                        className={styles.input}
                    />
                    <input
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className={styles.input}
                    />
                    <button type="submit" className={styles.button} disabled={isConfirming}>
                        {isConfirming ? 'Confirming…' : 'Confirm Reset'}
                    </button>
                    <button
                        type="button"
                        className={`${styles.button} ${styles.secondary}`}
                        onClick={() => setStep('request')}
                        disabled={isConfirming}
                    >
                        Back
                    </button>
                </form>
            )}

            {message && <p className={styles.statusMessage} role="status">{message}</p>}
            {error && <p className={styles.error} role="alert">{error}</p>}
        </div>
    );
}
