import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '@/auth';

// POST /api/blob/upload
// FormData: { file: File, path: string }
// Returns: { url: string }
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    if (!file || !path) {
        return NextResponse.json({ error: 'file and path are required' }, { status: 400 });
    }

    // Enforce that the path belongs to the requesting user (or admin)
    const ownedPrefix = `${session.user.id}/`;
    if (!path.includes(session.user.id) && !session.user.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log(path);
    const blob = await put(path, file, {
        access: 'public',
        contentType: file.type || 'application/octet-stream',
        allowOverwrite: true
    });

    return NextResponse.json({ url: blob.url });
}
