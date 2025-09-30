'use client';

import { useState, useEffect, Suspense } from 'react';
import { confirmSignUp, signIn, getCurrentUser, resendSignUpCode } from 'aws-amplify/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';
import styles from '../styles.module.css';

const authedRoute = '/play';

const client = generateClient<Schema>();

function ConfirmSignUpComponent() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmationCode, setConfirmationCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const auth = useAuth();
    if (!auth) throw new Error('Auth context not available');
    const { setUser }: { setUser: (user: any) => void } = auth;
    
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        const username = searchParams.get('username');
        const email = searchParams.get('email');
        const password = decodeURIComponent(searchParams.get('password') || '');

        if (username) setUsername(username);
        if (email) setEmail(email);
        if (password) setPassword(password);
    }, [searchParams]);

    const handleConfirmSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        try {
            // Step 1: Confirm sign up
            await confirmSignUp({
                username,
                confirmationCode
            });

            setMessage('Account confirmed. Signing in...');

            // Step 2: Sign in the user
            if (!password) {
                throw new Error('Password is missing. Please try signing up again.');
            }

            const { isSignedIn } = await signIn({ username, password });

            if (isSignedIn) {
                setMessage('Signed in. Creating user profile...');

                // Step 3: Get current user and create profile
                const user = await getCurrentUser();
                
                // Create Profile record
                try {
                    await client.models.Profile.create({
                        id: user.userId,
                        owner: user.userId,
                        username: email,
                        email: email,
                        avatar: 'https://assets.letmedemo.com/public/gameboy/images/users/default-avatar.png',
                        bio: '',
                        admin: false
                    });
                    setMessage('Profile created. Redirecting to game...');
                } catch (profileError) {
                    console.error('Error creating profile:', profileError);
                    // Continue even if profile creation fails
                }

                // Update the user in the AuthContext
                setUser(user);
                router.push(authedRoute);
            } else {
                setError('Sign in failed after confirmation.');
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                if (err.message.includes('User cannot be confirmed. Current status is CONFIRMED')) {
                    setMessage('Your account is already confirmed. Redirecting to game...');
                    try {
                        await signIn({ username, password });
                        const user = await getCurrentUser();
                        setUser(user);
                        router.push(authedRoute);
                    } catch (signInError) {
                        setError('Failed to sign in. Please try logging in manually.');
                        router.push('login');
                    }
                } else {
                    setError(err.message);
                }
            }
        }
    };

    const handleResendCode = async () => {
        if (!username) {
            setError('Username is required to resend code');
            return;
        }
        
        setIsResending(true);
        setError(null);
        setMessage(null);
        
        try {
            await resendSignUpCode({ username });
            setMessage('Verification code has been resent to your email');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Confirm Sign Up</h2>
            <form onSubmit={handleConfirmSignUp} className={styles.form}>
                <input
                    type="text"
                    placeholder="Confirmation Code"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                    required
                    className={styles.input}
                />
                <button type="submit" className={styles.button}>Confirm</button>
            </form>
            <button 
                onClick={handleResendCode} 
                disabled={isResending}
                className="button secondary"
                style={{ marginTop: '1rem' }}
            >
                {isResending ? 'Sending...' : 'Resend Code'}
            </button>
            {error && <p role="alert" className={styles.error}>{error}</p>}
            {message && <p role="status" className={styles.statusMessage}>{message}</p>}
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