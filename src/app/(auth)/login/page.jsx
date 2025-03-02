'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn, getCurrentUser } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authedRoute } from '../../../../config';
import '@/styles/auth.css';

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
        <div className="container">
            <h1 className="title">Login</h1>
            <form onSubmit={handleLogin} className="form">
                <input
                    type="text"
                    placeholder="Email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="input"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input"
                />
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="checkbox"
                    />
                    Remember Me
                </label>
                <button type="submit" className="button">Login</button>
            </form>
            {error && <p className="error" role="alert">{error}</p>}
            
            <div className="signup-prompt">
                Don&apos;t have an account? <Link href="/signup" className="signup-link">Sign up</Link>
            </div>
        </div>
    );
    
}