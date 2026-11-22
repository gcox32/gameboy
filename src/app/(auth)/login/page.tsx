'use client';

import { useState, useEffect, Suspense, FormEvent } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authedRoute } from '@/../config';
import PasswordInput from '@/components/auth/PasswordInput';
import styles from '../styles.module.css';
import buttons from '@/styles/buttons.module.css';

const FORM_ID = 'login-form';

function LoginComponent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [unverified, setUnverified] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const router = useRouter();
    const auth = useAuth();
    const searchParams = useSearchParams();

    const verified = searchParams.get('verified') === 'true';
    const resetSuccess = searchParams.get('reset') === 'success';

    useEffect(() => {
        try {
            const remembered = localStorage.getItem('rememberedEmail');
            if (remembered) {
                setEmail(remembered);
                setRememberMe(true);
            }
        } catch {
            // Storage unavailable (private mode); nothing to restore.
        }
    }, []);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setUnverified(false);
        setSubmitting(true);

        const normalizedEmail = email.trim();

        try {
            const result = await signIn('credentials', { email: normalizedEmail, password, redirect: false });

            if (result?.error) {
                if (result.code === 'unverified') {
                    setUnverified(true);
                } else if (result.code === 'rate_limited') {
                    setError('Too many login attempts. Try again in a few minutes.');
                } else {
                    setError('Invalid email or password.');
                }
                return;
            }

            try {
                if (rememberMe) localStorage.setItem('rememberedEmail', normalizedEmail);
                else localStorage.removeItem('rememberedEmail');
            } catch {
                // Remembering the email is a convenience only.
            }

            router.push(authedRoute);
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Sends a fresh code, then hands off to the verify page with the email filled in.
    const handleResend = async () => {
        setResending(true);
        const normalizedEmail = email.trim();
        try {
            const res = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: normalizedEmail }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? 'Could not send a new code. Please try again.');
                setResending(false);
                return;
            }
            router.push(`/confirm-signup?email=${encodeURIComponent(normalizedEmail)}&sent=true`);
        } catch {
            setError('Could not send a new code. Please try again.');
            setResending(false);
        }
    };

    if (auth?.loading) return <div>Loading...</div>;
    if (auth?.user) return null;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Login</h1>

            {verified && (
                <p className={styles.statusMessage} role="status">
                    Email verified. You can now log in.
                </p>
            )}
            {resetSuccess && (
                <p className={styles.statusMessage} role="status">
                    Password has been reset. You can sign in now.
                </p>
            )}

            <form id={FORM_ID} onSubmit={handleLogin} className={styles.form}>
                <input
                    type="email"
                    name="email"
                    aria-label="Email"
                    placeholder="Email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={styles.input}
                />
                <PasswordInput
                    name="password"
                    aria-label="Password"
                    placeholder="Password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={styles.input}
                />
                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className={styles.checkbox}
                    />
                    Remember Me
                </label>
            </form>

            {error && <p className={styles.error} role="alert">{error}</p>}
            {unverified && (
                <p className={styles.error} role="alert">
                    This email hasn&apos;t been verified yet.{' '}
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className={`${styles.link} ${styles.inlineButton}`}
                    >
                        {resending ? 'Sending…' : 'Send a new code'}
                    </button>
                </p>
            )}

            <button
                type="submit"
                form={FORM_ID}
                className={`${buttons.retroButton} ${styles.authSubmit}`}
                disabled={submitting}
            >
                {submitting ? 'Signing in…' : 'Login'}
            </button>

            <p className={styles.signupPrompt}>
                Don&apos;t have an account?{' '}
                <Link href="/signup" className={styles.signupLink}>Sign up</Link>
            </p>
            <p className={styles.signupPrompt}>
                <Link
                    href={`/reset-password${email ? `?email=${encodeURIComponent(email.trim())}` : ''}`}
                    className={styles.link}
                >
                    Forgot password?
                </Link>
            </p>
        </div>
    );
}

export default function Login() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginComponent />
        </Suspense>
    );
}
