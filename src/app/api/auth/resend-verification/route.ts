import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbConnect } from '@/lib/db';
import { User } from '@/models';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email: email.toLowerCase() });

        // Return success regardless to avoid user enumeration
        if (!user || user.emailVerified) {
            return NextResponse.json({ message: 'If that account exists, a new code has been sent.' }, { status: 200 });
        }

        const verificationToken = crypto.randomInt(100000, 999999).toString();
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await User.updateOne({ _id: user._id }, { verificationToken, verificationTokenExpiry });

        await sendVerificationEmail(email, verificationToken);

        return NextResponse.json({ message: 'If that account exists, a new code has been sent.' }, { status: 200 });
    } catch (err) {
        console.error('[resend-verification]', err);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
