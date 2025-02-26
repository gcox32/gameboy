'use client';

import '@/styles/auth.css';

export default function ResetPassword() {
    return (
        <div className="container">
            <h1 className="title">Reset Password</h1>
            <p className="paragraph">Enter your email to receive a password reset link.</p>
            <form className="form">
                <input
                    type="email"
                    placeholder="Email"
                    required
                    className="input"
                />
                <button type="submit" className="button">Send Reset Link</button>
            </form>
        </div>
    );
}
