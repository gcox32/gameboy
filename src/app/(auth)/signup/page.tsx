'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import PasswordInput from '@/components/auth/PasswordInput';
import styles from '../styles.module.css';
import buttons from '@/styles/buttons.module.css';

const FORM_ID = 'signup-form';
const MIN_PASSWORD = 8;

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();
    const auth = useAuth();

    if (auth && !auth.loading && auth.user) return null;

    const handleSignUp = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!agreeToTerms) {
            setError('You must agree to the Terms and Privacy Policy.');
            return;
        }

        const normalizedEmail = email.trim();
        setSubmitting(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: normalizedEmail, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? 'An error occurred.');
                return;
            }

            router.push(`/confirm-signup?email=${encodeURIComponent(normalizedEmail)}`);
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Sign Up</h1>

            <form id={FORM_ID} onSubmit={handleSignUp} className={styles.form}>
                <input
                    type="email"
                    name="email"
                    aria-label="Email"
                    placeholder="Email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={styles.input}
                />
                <PasswordInput
                    name="password"
                    aria-label="Password"
                    aria-describedby="signup-password-hint"
                    placeholder="Password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={MIN_PASSWORD}
                    className={styles.input}
                />
                <p id="signup-password-hint" className={styles.fieldHint}>
                    At least {MIN_PASSWORD} characters.
                </p>
            </form>

            <label className={styles.termsLabel}>
                <input
                    type="checkbox"
                    form={FORM_ID}
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
                type="submit"
                form={FORM_ID}
                className={`${buttons.retroButton} ${styles.authSubmit}`}
                disabled={submitting}
            >
                {submitting ? 'Creating account…' : 'Sign Up'}
            </button>

            <p className={styles.signupPrompt}>
                Already have an account?{' '}
                <Link href="/login" className={styles.signupLink}>Log in</Link>
            </p>
        </div>
    );
}
