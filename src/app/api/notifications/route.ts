import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Notification } from '@/models';

// GET /api/notifications           — current user's notifications + BROADCAST ones
// GET /api/notifications?unread=true — unread only
// GET /api/notifications?all=true  — all notifications (admin only)
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';
    const unreadOnly = searchParams.get('unread') === 'true';

    await dbConnect();

    let filter: Record<string, unknown>;

    if (all) {
        if (!session.user.admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        filter = {};
    } else {
        filter = { userId: { $in: [session.user.id, 'BROADCAST'] } };
        if (unreadOnly) filter.readAt = { $exists: false };
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(notifications.map(n => n.toJSON()));
}

// POST /api/notifications — create a notification (admin only)
// Use userId: 'BROADCAST' to send to all users
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, sender, type, title, body: notifBody } = body;

    if (!userId || !sender || !type || !title) {
        return NextResponse.json({ error: 'userId, sender, type and title are required' }, { status: 400 });
    }

    await dbConnect();
    const notification = await Notification.create({ userId, sender, type, title, body: notifBody });
    return NextResponse.json(notification.toJSON(), { status: 201 });
}
