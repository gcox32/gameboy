import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { dbConnect } from '@/lib/db';
import { clientIp, limitAuth, tooManyRequests } from '@/lib/rateLimit';
import { User, Profile } from '@/models';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const email = typeof body.email === 'string' ? body.email.trim() : '';
        const password = typeof body.password === 'string' ? body.password : '';

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
        }

        await dbConnect();

        const limit = await limitAuth('register', { ip: clientIp(req.headers) });
        if (!limit.ok) return tooManyRequests(limit.retryAfter);

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return NextResponse.json({ error: 'An account with this email already exists. Log in instead, or reset your password.' }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const verificationToken = crypto.randomInt(100000, 999999).toString(); // 6-digit code
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        const user = await User.create({
            email: email.toLowerCase(),
            passwordHash,
            emailVerified: false,
            verificationToken,
            verificationTokenExpiry,
        });

        // Create a default profile
        await Profile.create({
            userId: user._id,
            username: email.split('@')[0],
            email: email.toLowerCase(),
        });

        // The account exists either way; if the email fails they can ask for a new code from login
        await sendVerificationEmail(email, verificationToken).catch((err) => console.error('[register] send failed', err));

        return NextResponse.json({ message: 'Account created. Check your email for a verification code.' }, { status: 201 });
    } catch (err) {
        console.error('[register]', err);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
