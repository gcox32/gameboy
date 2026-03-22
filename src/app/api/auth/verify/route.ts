import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User } from '@/models';

export async function POST(req: NextRequest) {
    try {
        const { email, code } = await req.json();

        if (!email || !code) {
            return NextResponse.json({ error: 'Email and code are required.' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return NextResponse.json({ error: 'Invalid code.' }, { status: 400 });
        }

        if (user.emailVerified) {
            return NextResponse.json({ message: 'Email already verified.' }, { status: 200 });
        }

        if (
            user.verificationToken !== code ||
            !user.verificationTokenExpiry ||
            user.verificationTokenExpiry < new Date()
        ) {
            return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 400 });
        }

        await User.updateOne(
            { _id: user._id },
            { $set: { emailVerified: true }, $unset: { verificationToken: '', verificationTokenExpiry: '' } }
        );

        return NextResponse.json({ message: 'Email verified. You can now log in.' }, { status: 200 });
    } catch (err) {
        console.error('[verify]', err);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
