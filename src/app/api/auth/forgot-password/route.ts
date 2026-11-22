import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { clientIp, limitAuth, tooManyRequests } from '@/lib/rateLimit';
import { User } from '@/models';
import { sendPasswordReset } from '@/lib/accounts';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
        }

        await dbConnect();

        const limit = await limitAuth('forgotPassword', { email, ip: clientIp(req.headers) });
        if (!limit.ok) return tooManyRequests(limit.retryAfter);

        const user = await User.findOne({ email: email.toLowerCase() });

        // Always return success to avoid user enumeration
        if (!user) {
            return NextResponse.json({ message: 'If that account exists, a reset link has been sent.' }, { status: 200 });
        }

        // A failed send is logged, not reported, so the response can't reveal the account exists
        await sendPasswordReset(user).catch((err) => console.error('[forgot-password] send failed', err));

        return NextResponse.json({ message: 'If that account exists, a reset link has been sent.' }, { status: 200 });
    } catch (err) {
        console.error('[forgot-password]', err);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
