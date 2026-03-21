'use client';

import { useState, useEffect } from 'react';
import { signUp } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { authedRoute } from '@/../config';
import styles from '../styles.module.css';
import buttons from '@/styles/buttons.module.css';

export default function SignUp() {
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const router = useRouter();
    const auth = useAuth();

    useEffect(() => {
        if (auth) {
            const { user, loading } = auth;
            if (!loading && user) {
                router.push(authedRoute);
            }
        }
    }, [auth, router]);

    if (auth && !auth.loading && auth.user) {
        return null;
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!agreeToTerms) {
            setError('You must agree to the Terms and Conditions and Privacy Policy');
            return;
        }

        try {
            const { isSignUpComplete } = await signUp({
                username: email,
                password,
                options: { userAttributes: { email } },
            });

            if (isSignUpComplete) {
                router.push('login');
            } else {
                const encodedPassword = encodeURIComponent(password);
                router.push(`confirm-signup?username=${email}&email=${email}&password=${encodedPassword}`);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
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
                onClick={(e) => handleSignUp(e as unknown as React.FormEvent)}
                className={`${buttons.retroButton} ${styles.authSubmit}`}
            >
                Sign Up
            </button>

            <p className={styles.signupPrompt}>
                Already have an account?{' '}
                <Link href="login" className={styles.signupLink}>Log in</Link>
            </p>
        </div>
    );
}
