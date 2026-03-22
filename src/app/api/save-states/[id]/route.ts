import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { SaveState } from '@/models';

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
    const { title, description, filePath, img } = body;

    if (title !== undefined) saveState.title = title;
    if (description !== undefined) saveState.description = description;
    if (filePath !== undefined) saveState.filePath = filePath;
    if (img !== undefined) saveState.img = img;

    await saveState.save();
    return NextResponse.json(saveState.toJSON());
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
