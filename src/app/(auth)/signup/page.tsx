'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { authedRoute } from '@/../config';
import styles from '../styles.module.css';
import buttons from '@/styles/buttons.module.css';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();
    const auth = useAuth();

    useEffect(() => {
        if (auth && !auth.loading && auth.user) {
            router.push(authedRoute);
        }
    }, [auth, router]);

    if (auth && !auth.loading && auth.user) return null;

    const handleSignUp = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!agreeToTerms) {
            setError('You must agree to the Terms and Privacy Policy.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? 'An error occurred.');
                return;
            }

            router.push(`/confirm-signup?email=${encodeURIComponent(email)}`);
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Sign Up</h1>

            <form onSubmit={handleSignUp} className={styles.form}>
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
            </form>

            <label className={styles.termsLabel}>
                <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className={styles.checkbox}
                />
                <span>
                    I agree to the{' '}
                    <Link href="/terms" className={styles.link}>Terms</Link>
                    {' '}and{' '}
                    <Link href="/privacy-policy" className={styles.link}>Privacy Policy</Link>
                </span>
            </label>

            {error && <p className={styles.error} role="alert">{error}</p>}

            <button
                onClick={(e) => handleSignUp(e as unknown as FormEvent)}
                className={`${buttons.retroButton} ${styles.authSubmit}`}
                disabled={submitting}
            >
                {submitting ? 'Creating account…' : 'Sign Up'}
            </button>

            <p className={styles.signupPrompt}>
                Already have an account?{' '}
                <Link href="login" className={styles.signupLink}>Log in</Link>
            </p>
        </div>
    );
}
