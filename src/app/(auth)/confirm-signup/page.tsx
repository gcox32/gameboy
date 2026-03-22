'use client';

import { useState, useEffect, Suspense, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../styles.module.css';
import buttons from '@/styles/buttons.module.css';

function ConfirmSignUpComponent() {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) setEmail(emailParam);
    }, [searchParams]);

    const handleVerify = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? 'Verification failed.');
                return;
            }

            router.push('/login?verified=true');
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResend = async () => {
        setError(null);
        setMessage(null);
        setResending(true);

        try {
            await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            setMessage('A new code has been sent to your email.');
        } catch {
            setError('Failed to resend. Please try again.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Verify Email</h1>

            <form onSubmit={handleVerify} className={styles.form}>
                <input
                    type="text"
                    placeholder="6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    maxLength={6}
                    className={styles.input}
                    inputMode="numeric"
                />
            </form>

            {error && <p className={styles.error} role="alert">{error}</p>}
            {message && <p className={styles.statusMessage} role="status">{message}</p>}

            <button
                onClick={(e) => handleVerify(e as unknown as FormEvent)}
                className={`${buttons.retroButton} ${styles.authSubmit}`}
                disabled={submitting}
            >
                {submitting ? 'Verifying…' : 'Verify'}
            </button>

            <p className={styles.signupPrompt}>
                Didn&apos;t receive a code?{' '}
                <button
                    onClick={handleResend}
                    disabled={resending}
                    className={styles.link}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                    {resending ? 'Sending…' : 'Resend'}
                </button>
            </p>
        </div>
    );
}

export default function ConfirmSignUp() {
    return (
        <Suspense fallback={<p>Loading...</p>}>
            <ConfirmSignUpComponent />
        </Suspense>
    );
}
