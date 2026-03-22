'use client';

import { useState, useEffect, Suspense, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../styles.module.css';
import buttons from '@/styles/buttons.module.css';

function ResetPasswordComponent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    const token = searchParams.get('token');

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) setEmail(emailParam);
    }, [searchParams]);

    // Step 1: request a reset link
    const handleRequest = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            setMessage('If that account exists, a reset link has been sent to your email.');
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Step 2: set new password using token from link
    const handleReset = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? 'Reset failed.');
                return;
            }

            router.push('/login?reset=success');
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Reset Password</h1>

            {token ? (
                // Token present — user arrived via email link
                <form onSubmit={handleReset} className={styles.form}>
                    <input
                        type="password"
                        placeholder="New password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className={styles.input}
                    />
                    {error && <p className={styles.error} role="alert">{error}</p>}
                    <button type="submit" className={buttons.retroButton} style={{ margin: '0 auto' }} disabled={submitting}>
                        {submitting ? 'Saving…' : 'Set New Password'}
                    </button>
                </form>
            ) : (
                // No token — request a reset link
                <>
                    {message ? (
                        <p className={styles.statusMessage} role="status">{message}</p>
                    ) : (
                        <form onSubmit={handleRequest} className={styles.form}>
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className={styles.input}
                            />
                            {error && <p className={styles.error} role="alert">{error}</p>}
                            <button type="submit" className={buttons.retroButton} style={{ margin: '0 auto' }} disabled={submitting}>
                                {submitting ? 'Sending…' : 'Send Reset Link'}
                            </button>
                        </form>
                    )}
                </>
            )}
        </div>
    );
}

export default function ResetPassword() {
    return (
        <Suspense fallback={<p>Loading...</p>}>
            <ResetPasswordComponent />
        </Suspense>
    );
}
