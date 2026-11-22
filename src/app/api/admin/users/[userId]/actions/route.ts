import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { requireAdmin } from '@/lib/requireAdmin';
import { dbConnect } from '@/lib/db';
import { clearEmailLimits, markEmailVerified, sendPasswordReset, sendVerificationCode } from '@/lib/accounts';
import { User } from '@/models';

type Params = { params: Promise<{ userId: string }> };

const ACTIONS = ['resendVerification', 'verifyEmail', 'sendPasswordReset', 'clearRateLimits'] as const;
type Action = (typeof ACTIONS)[number];

// POST /api/admin/users/:userId/actions { action } — account help for a user.
// Not rate limited: an admin is often doing this because the user hit their own limit.
export async function POST(req: NextRequest, { params }: Params) {
    const { denied } = await requireAdmin();
    if (denied) return denied;

    const { userId } = await params;
    if (!isValidObjectId(userId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { action } = await req.json() as { action?: Action };
    if (!action || !ACTIONS.includes(action)) {
        return NextResponse.json({ error: `action must be one of ${ACTIONS.join(', ')}` }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(userId).select('email emailVerified');
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    try {
        switch (action) {
            case 'resendVerification':
                if (user.emailVerified) return NextResponse.json({ error: 'Their email is already verified' }, { status: 409 });
                await sendVerificationCode(user);
                return NextResponse.json({ message: `Sent a new code to ${user.email}` });
            case 'verifyEmail':
                if (user.emailVerified) return NextResponse.json({ error: 'Their email is already verified' }, { status: 409 });
                await markEmailVerified(user._id);
                return NextResponse.json({ message: `Verified ${user.email}` });
            case 'sendPasswordReset':
                await sendPasswordReset(user);
                return NextResponse.json({ message: `Sent a reset link to ${user.email}` });
            case 'clearRateLimits': {
                const cleared = await clearEmailLimits(user.email);
                return NextResponse.json({ message: cleared ? `Cleared ${cleared} limit${cleared === 1 ? '' : 's'}` : 'No limits to clear' });
            }
        }
    } catch (err) {
        console.error(`[admin] ${action} failed for ${userId}:`, err);
        return NextResponse.json({ error: (err as Error).message || 'Something went wrong' }, { status: 502 });
    }
}
