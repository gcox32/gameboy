import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/auth';

/** The session if the caller is an admin, or the response to send instead. */
export async function requireAdmin(): Promise<{ session: Session; denied?: undefined } | { session?: undefined; denied: NextResponse }> {
    const session = await auth();
    if (!session?.user?.id) return { denied: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    if (!session.user.admin) return { denied: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    return { session };
}
