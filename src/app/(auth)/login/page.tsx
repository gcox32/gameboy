'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn, getCurrentUser } from 'aws-amplify/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authedRoute } from '@/../config';
import styles from '../styles.module.css';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const auth = useAuth();
    if (!auth) throw new Error('Auth context not available');
    const { user, loading } = auth;
    const { setUser }: { setUser: (user: any) => void } = auth;

    useEffect(() => {
        if (!loading && user) {
            router.push(authedRoute);
        }
    }, [user, loading, router]);

    useEffect(() => {
        const rememberedUsername = localStorage.getItem('rememberedUsername');
        if (rememberedUsername) {
            setUsername(rememberedUsername);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const { isSignedIn, nextStep } = await signIn({
                username,
                password,
                options: {
                    clientMetadata: {
                        rememberDevice: rememberMe ? 'true' : 'false'
                    }
                }
            });
            if (isSignedIn) {
                const updatedUser = await getCurrentUser();
                setUser(updatedUser);
                if (rememberMe) {
                    localStorage.setItem('rememberedUsername', username);
                } else {
                    localStorage.removeItem('rememberedUsername');
                }
                router.push(authedRoute);
            } else {
                handleNextStep(nextStep.signInStep);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleNextStep = (nextStep: string) => {
        switch (nextStep) {
            case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
                router.push('/new-password');
                break;
            case 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE':
                router.push('/custom-challenge');
                break;
            case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
                router.push('/totp');
                break;
            case 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP':
                router.push('/totp-setup');
                break;
            case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
                router.push('/sms');
                break;
            case 'CONTINUE_SIGN_IN_WITH_MFA_SELECTION':
                router.push('/mfa-selection');
                break;
            case 'RESET_PASSWORD':
                router.push('/reset-password');
                break;
            case 'CONFIRM_SIGN_UP':
                router.push('/confirm-signup');
                break;
            case 'DONE':
                router.push('/');
                break;
            default:
                setError('Unknown next step');
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!loading && user) {
        return null;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Login</h1>
            <form onSubmit={handleLogin} className={styles.form}>
                <input
                    type="text"
                    placeholder="Email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                <button type="submit" className={styles.button}>Login</button>
            </form>
            {error && <p className={styles.error} role="alert">{error}</p>}
            {searchParams.get('reset') === 'success' && (
                <p className={styles.statusMessage} role="status">Password has been reset. You can sign in now.</p>
            )}
            
            <div className={styles.signupPrompt}>
                {`Don't have an account? `}<Link href="/signup" className={styles.signupLink}>Sign up</Link>
            </div>
            <div className={styles.signupPrompt}>
                <Link
                    href={`/reset-password${username ? `?username=${encodeURIComponent(username)}` : ''}`}
                    className={styles.link}
                >
                    Forgot password?
                </Link>
            </div>
        </div>
    );
    
}