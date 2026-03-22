import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Notification } from '@/models';

type Params = { params: Promise<{ id: string }> };

// PUT /api/notifications/:id — mark as read
export async function PUT(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const notification = await Notification.findById(id);

    if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (notification.userId.toString() !== session.user.id) {
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
    await dbConnect();
    const notification = await Notification.findById(id);

    if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (notification.userId.toString() !== session.user.id && !session.user.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await notification.deleteOne();
    return NextResponse.json({ success: true });
}
