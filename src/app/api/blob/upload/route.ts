import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ownsBlobPath, putUserFile } from '@/lib/blob';

// POST /api/blob/upload
// FormData: { file: File, path: string, unique?: 'true' }
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

    if (!ownsBlobPath(path, session.user) && !session.user.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = await putUserFile(path, file, {
        contentType: file.type || 'application/octet-stream',
        ...(formData.get('unique') === 'true' ? { addRandomSuffix: true } : { allowOverwrite: true }),
    });

    return NextResponse.json({ url });
}
