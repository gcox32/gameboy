import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Notification } from '@/models';
import { isValidObjectId } from 'mongoose';

type Params = { params: Promise<{ id: string }> };

// PUT /api/notifications/:id — mark as read (for a broadcast, read by this user only)
export async function PUT(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await dbConnect();
    const notification = await Notification.findById(id);

    if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const me = session.user.id;
    if (notification.userId === 'BROADCAST') {
        // Read per user. The filter makes it a no-op if they've already read it, even when two requests race.
        const readAt = new Date();
        await Notification.updateOne(
            { _id: notification._id, 'readBy.userId': { $ne: me } },
            { $push: { readBy: { userId: me, readAt } } },
        );
        const view = notification.toJSON() as unknown as Record<string, unknown>;
        delete view.readBy; // other readers stay private
        view.readAt = notification.readBy?.find(r => r.userId === me)?.readAt ?? readAt;
        return NextResponse.json(view);
    }

    if (notification.userId !== me) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    notification.readAt = new Date();
    await notification.save();
    return NextResponse.json(notification.toJSON());
}

// DELETE /api/notifications/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await dbConnect();
    const notification = await Notification.findById(id);

    if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (notification.userId.toString() !== session.user.id && !session.user.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await notification.deleteOne();
    return NextResponse.json({ success: true });
}
