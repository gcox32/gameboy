import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? 'noreply@resend.dev';
const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

export async function sendVerificationEmail(email: string, code: string) {
    await resend.emails.send({
        from: FROM,
        to: email,
        subject: 'Verify your email — JS GBC',
        html: `
            <p>Enter this code on the verification page:</p>
            <h2 style="letter-spacing: 8px; font-size: 32px;">${code}</h2>
            <p>This code expires in 24 hours.</p>
        `,
    });
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const link = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await resend.emails.send({
        from: FROM,
        to: email,
        subject: 'Reset your password — JS GBC',
        html: `
            <p>Click the link below to reset your password. It expires in 1 hour.</p>
            <a href="${link}">${link}</a>
        `,
    });
}
