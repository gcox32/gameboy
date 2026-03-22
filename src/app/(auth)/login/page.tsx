'use client';

import { useState, useEffect, Suspense, FormEvent } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authedRoute } from '@/../config';
import styles from '../styles.module.css';
import buttons from '@/styles/buttons.module.css';

function LoginComponent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();
    const auth = useAuth();
    const searchParams = useSearchParams();

    const verified = searchParams.get('verified') === 'true';
    const resetSuccess = searchParams.get('reset') === 'success';

    useEffect(() => {
        if (auth && !auth.loading && auth.user) {
            router.push(authedRoute);
        }
    }, [auth, router]);

    useEffect(() => {
        const remembered = localStorage.getItem('rememberedEmail');
        if (remembered) {
            setEmail(remembered);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const result = await signIn('credentials', { email, password, redirect: false });

            if (result?.error) {
                setError('Invalid email or password.');
                return;
            }

            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            router.push(authedRoute);
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
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

            <form onSubmit={handleLogin} className={styles.form}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={styles.input}
                />
                <input
                    type="password"
                    placeholder="Password"
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

            <button
                onClick={(e) => handleLogin(e as unknown as FormEvent)}
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
                    href={`/reset-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
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
