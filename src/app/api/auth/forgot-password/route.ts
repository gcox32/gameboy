import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbConnect } from '@/lib/db';
import { User } from '@/models';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email: email.toLowerCase() });

        // Always return success to avoid user enumeration
        if (!user) {
            return NextResponse.json({ message: 'If that account exists, a reset link has been sent.' }, { status: 200 });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await User.updateOne({ _id: user._id }, { resetToken, resetTokenExpiry });

        await sendPasswordResetEmail(email, resetToken);

        return NextResponse.json({ message: 'If that account exists, a reset link has been sent.' }, { status: 200 });
    } catch (err) {
        console.error('[forgot-password]', err);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
