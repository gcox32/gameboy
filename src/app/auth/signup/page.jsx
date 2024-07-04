'use client';

import { useState } from 'react';
import { signUp } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Amplify } from 'aws-amplify';
import awsconfig from '../../../aws-exports';

Amplify.configure(awsconfig);

export default function SignUp() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const router = useRouter();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError(null);
    
        if (!agreeToTerms) {
            setError('You must agree to the Terms and Conditions and Privacy Policy');
            return;
        }
    
        try {
            const { isSignUpComplete, userId, nextStep } = await signUp({
                username,
                password,
                options: {
                    userAttributes: {
                        email
                    },
                }
            });
    
            if (isSignUpComplete) {
                router.push('/auth/login');
            } else {
                // Encode the password to make it URL-safe
                const encodedPassword = encodeURIComponent(password);
                router.push(`/auth/confirm-signup?username=${username}&email=${email}&password=${encodedPassword}`);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <h1>Sign Up</h1>
            <form onSubmit={handleSignUp}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        required
                    />
                    I agree to the <Link href="/terms">Terms and Conditions</Link> and <Link href="/privacy-policy">Privacy Policy</Link>
                </label>
                <button type="submit">Sign Up</button>
            </form>
            {error && <p role="alert">{error}</p>}
            <p>Already have an account? <Link href="/auth/login">Log in</Link></p>
        </div>
    );
}