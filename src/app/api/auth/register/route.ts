import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { dbConnect } from '@/lib/db';
import { User, Profile } from '@/models';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
        }

        await dbConnect();

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
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
            admin: false,
        });

        await sendVerificationEmail(email, verificationToken);

        return NextResponse.json({ message: 'Account created. Check your email for a verification code.' }, { status: 201 });
    } catch (err) {
        console.error('[register]', err);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
