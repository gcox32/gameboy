import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { SaveState } from '@/models';
import { SAVE_CHANGED_MESSAGE, updateSaveRecord } from '@/lib/saveFile';
import { isUserSaveUrl } from '@/utils/blobPaths';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const saveState = await SaveState.findById(id);

    if (!saveState) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (saveState.userId.toString() !== session.user.id && !session.user.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(saveState.toJSON());
}

export async function PUT(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const saveState = await SaveState.findById(id);

    if (!saveState) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (saveState.userId.toString() !== session.user.id && !session.user.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, filePath, img, expectedFilePath } = body;

    if (filePath !== undefined && filePath !== saveState.filePath) {
        if (!session.user.admin && !isUserSaveUrl(filePath, session.user)) {
            return NextResponse.json({ error: 'Invalid filePath' }, { status: 400 });
        }
        if (typeof expectedFilePath !== 'string') {
            return NextResponse.json({ error: 'expectedFilePath is required to change filePath' }, { status: 400 });
        }
    }

    const updated = await updateSaveRecord(saveState, { title, description, filePath, img }, expectedFilePath);
    if (!updated) {
        // Sent back so the client can choose to save over it, knowing what it's replacing
        const current = await SaveState.findById(id);
        return NextResponse.json(
            { error: SAVE_CHANGED_MESSAGE, currentFilePath: current?.filePath ?? '' },
            { status: 409 },
        );
    }
    return NextResponse.json(updated.toJSON());
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const saveState = await SaveState.findById(id);

    if (!saveState) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (saveState.userId.toString() !== session.user.id && !session.user.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await saveState.deleteOne();
    return NextResponse.json({ success: true });
}
