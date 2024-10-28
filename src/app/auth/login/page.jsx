'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn, getCurrentUser } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Amplify } from 'aws-amplify';
import awsconfig from '../../../aws-exports';
import { authedRoute } from '../../../../config';

Amplify.configure(awsconfig);

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();
    const { user, setUser, loading } = useAuth();

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

    const handleLogin = async (e) => {
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
        } catch (err) {
            setError(err.message);
        }
    };

    const handleNextStep = (nextStep) => {
        switch (nextStep) {
            case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
                router.push('/auth/new-password');
                break;
            case 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE':
                router.push('/auth/custom-challenge');
                break;
            case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
                router.push('/auth/totp');
                break;
            case 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP':
                router.push('/auth/totp-setup');
                break;
            case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
                router.push('/auth/sms');
                break;
            case 'CONTINUE_SIGN_IN_WITH_MFA_SELECTION':
                router.push('/auth/mfa-selection');
                break;
            case 'RESET_PASSWORD':
                router.push('/auth/reset-password');
                break;
            case 'CONFIRM_SIGN_UP':
                router.push('/auth/confirm-signup');
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
        <div>
            <h1>Login</h1>
            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <label>
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember Me
                </label>
                <button type="submit">Login</button>
            </form>
            {error && <p role="alert">{error}</p>}
            
            {/* Add this new section for the sign-up link */}
            <div style={{ marginTop: '20px' }}>
                Don&apos;t have an account? <Link href="/auth/signup">Sign up</Link>
            </div>
        </div>
    );
}