import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import { User } from '@/models';

export async function POST(req: NextRequest) {
    try {
        const { email, token, password } = await req.json();

        if (!email || !token || !password) {
            return NextResponse.json({ error: 'Email, token, and new password are required.' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({
            email: email.toLowerCase(),
            resetToken: token,
            resetTokenExpiry: { $gt: new Date() },
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await User.updateOne(
            { _id: user._id },
            { $set: { passwordHash }, $unset: { resetToken: '', resetTokenExpiry: '' } }
        );

        return NextResponse.json({ message: 'Password updated. You can now log in.' }, { status: 200 });
    } catch (err) {
        console.error('[reset-password]', err);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
