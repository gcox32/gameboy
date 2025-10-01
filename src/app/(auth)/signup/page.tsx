'use client';

import { useState } from 'react';
import { signUp } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../styles.module.css';

export default function SignUp() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent) => {
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
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    return (
        <div className={`${styles.container} ${styles.buttonGroup}`}>
            <h1 className={styles.title}>Sign Up</h1>
            <form onSubmit={handleSignUp} className={styles.form}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setUsername(e.target.value);
                    }}
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
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        required
                        className={styles.checkbox}
                    />
                    I agree to the <Link href="/terms" className={styles.link}>Terms and Conditions</Link> and <Link href="/privacy-policy" className={styles.link}>Privacy Policy</Link>
                </label>
                <button type="submit" className={styles.primaryButton} style={{ margin: '0 auto' }}>Sign Up</button>
            </form>
            {error && <p className={styles.error} role="alert">{error}</p>}
            
            <p className={styles.footerText}>Already have an account? <Link href="login" className={styles.link}>Log in</Link></p>
        </div>
    );
    
}