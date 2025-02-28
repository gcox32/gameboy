'use client';

import { useState } from 'react';
import { Amplify } from 'aws-amplify';
import outputs from '../../../../amplify_outputs.json';
import { signUp } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '@/styles/auth.css';

Amplify.configure(outputs);

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
            const { isSignUpComplete } = await signUp({
                username,
                password,
                options: {
                    userAttributes: {
                        email
                    },
                }
            });
    
            if (isSignUpComplete) {
                router.push('login');
            } else {
                // Encode the password to make it URL-safe
                const encodedPassword = encodeURIComponent(password);
                router.push(`confirm-signup?username=${username}&email=${email}&password=${encodedPassword}`);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container">
            <h1 className="title">Sign Up</h1>
            <form onSubmit={handleSignUp} className="form">
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="input"
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        required
                        className="checkbox"
                    />
                    I agree to the <Link href="/terms" className="link">Terms and Conditions</Link> and <Link href="/privacy-policy" className="link">Privacy Policy</Link>
                </label>
                <button type="submit" className="button">Sign Up</button>
            </form>
            {error && <p className="error" role="alert">{error}</p>}
            
            <p className="footer-text">Already have an account? <Link href="login" className="link">Log in</Link></p>
        </div>
    );
    
}