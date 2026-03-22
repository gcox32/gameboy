import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { auth } from '@/auth';

// DELETE /api/blob?url=<blobUrl>
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    // Verify the URL contains the user's ID (or user is admin)
    if (!url.includes(session.user.id) && !session.user.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await del(url);
    return NextResponse.json({ success: true });
}
