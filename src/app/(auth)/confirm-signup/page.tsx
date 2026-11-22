'use client';

import { useState, useEffect, Suspense, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../styles.module.css';
import buttons from '@/styles/buttons.module.css';

const FORM_ID = 'confirm-signup-form';

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
        if (searchParams.get('sent') === 'true') setMessage('A new code has been sent to your email.');
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
            const res = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? 'Failed to resend. Please try again.');
                return;
            }
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

            <p className={styles.description}>
                {email ? <>Enter the 6-digit code sent to {email}.</> : 'Enter the 6-digit code from your email.'}
            </p>

            <form id={FORM_ID} onSubmit={handleVerify} className={styles.form}>
                <input
                    type="text"
                    name="code"
                    aria-label="Verification code"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    placeholder="6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    required
                    maxLength={6}
                    className={styles.input}
                    inputMode="numeric"
                />
            </form>

            {error && <p className={styles.error} role="alert">{error}</p>}
            {message && <p className={styles.statusMessage} role="status">{message}</p>}

            <button
                type="submit"
                form={FORM_ID}
                className={`${buttons.retroButton} ${styles.authSubmit}`}
                disabled={submitting}
            >
                {submitting ? 'Verifying…' : 'Verify'}
            </button>

            <p className={styles.signupPrompt}>
                Didn&apos;t receive a code?{' '}
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || !email}
                    className={`${styles.link} ${styles.inlineButton}`}
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
