'use client';

import '@/styles/auth.css';

export default function NewPassword() {
    return (
        <div className="container">
            <h1 className="title">Set New Password</h1>
            <p className="paragraph">You need to set a new password.</p>
            <form className="form">
                <input
                    type="password"
                    placeholder="New Password"
                    required
                    className="input"
                />
                <input
                    type="password"
                    placeholder="Confirm New Password"
                    required
                    className="input"
                />
                <button type="submit" className="button">Submit</button>
            </form>
        </div>
    );
}
