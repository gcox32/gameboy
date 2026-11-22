import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { deleteBlob, ownsBlobUrl } from '@/lib/blob';

// DELETE /api/blob?url=<blobUrl>
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = req.nextUrl.searchParams.get('url');
    if (!url) {
        return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    if (!ownsBlobUrl(url, session.user) && !session.user.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteBlob(url);
    return NextResponse.json({ success: true });
}
