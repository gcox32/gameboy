import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Notification } from '@/models';
import { recordAudit } from '@/lib/audit';
import { accountNames, BROADCAST, notExpired, validateDraft } from '@/lib/notifications';
import type { INotification } from '@/models';

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

    if (all) {
        if (!session.user.admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const notifications = await Notification.find(notExpired()).sort({ createdAt: -1 });
        const names = await accountNames(notifications.flatMap(n => [n.userId, n.sender]));
        return NextResponse.json(notifications.map(n => {
            const { readBy, ...rest } = n.toJSON() as unknown as INotification & Record<string, unknown>;
            const named = { ...rest, recipientName: names.get(n.userId), senderName: names.get(n.sender) };
            return n.userId === 'BROADCAST' ? { ...named, readCount: readBy?.length ?? 0 } : named;
        }));
    }

    const me = session.user.id;
    const filter = unreadOnly
        ? { $or: [
            { userId: me, readAt: { $exists: false } },
            { userId: 'BROADCAST', 'readBy.userId': { $ne: me } },
        ] }
        : { userId: { $in: [me, 'BROADCAST'] } };

    const notifications = await Notification.find({ $and: [filter, notExpired()] }).sort({ createdAt: -1 });
    return NextResponse.json(notifications.map(n => toUserView(n, me)));
}

/** A notification as one user sees it: a broadcast's readAt is their own, and other readers stay hidden. */
function toUserView(n: INotification, userId: string) {
    const { readBy, ...rest } = n.toJSON() as unknown as INotification & Record<string, unknown>;
    if (n.userId !== 'BROADCAST') return rest;
    return { ...rest, readAt: readBy?.find(r => r.userId === userId)?.readAt };
}

// POST /api/notifications { userId, type, title, body?, expiresAt? } — send a notification (admin only).
// userId is an account's id, or 'BROADCAST' for everyone. Without expiresAt it stays until deleted.
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const input = await req.json().catch(() => null);
    if (!input || typeof input !== 'object') return NextResponse.json({ error: 'Expected a JSON body' }, { status: 400 });

    await dbConnect();
    const checked = await validateDraft(input);
    if (checked.error !== undefined) return NextResponse.json({ error: checked.error }, { status: checked.status });
    const { draft, recipientEmail } = checked;

    const notification = await Notification.create({ ...draft, sender: 'SYSTEM' });
    const expires = draft.expiresAt && { expiresAt: draft.expiresAt.toISOString() };
    await recordAudit(session, {
        action: 'notification.send', targetId: String(notification._id), targetLabel: draft.title,
        ...(draft.userId === BROADCAST
            ? { details: { to: 'everyone', type: draft.type, ...expires } }
            : { targetUserId: draft.userId, targetEmail: recipientEmail, details: { type: draft.type, ...expires } }),
    });
    return NextResponse.json(notification.toJSON(), { status: 201 });
}
