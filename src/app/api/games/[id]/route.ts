import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Game } from '@/models';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const game = await Game.findById(id);

    if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (game.userId.toString() !== session.user.id && !session.user.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(game.toJSON());
}

export async function PUT(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const game = await Game.findById(id);

    if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (game.userId.toString() !== session.user.id && !session.user.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { title, filePath, img, metadata } = body;

    if (title !== undefined) game.title = title;
    if (filePath !== undefined) game.filePath = filePath;
    if (img !== undefined) game.img = img;
    if (metadata !== undefined) {
        game.metadata = metadata;
        game.markModified('metadata');
    }

    await game.save();
    return NextResponse.json(game.toJSON());
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const game = await Game.findById(id);

    if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (game.userId.toString() !== session.user.id && !session.user.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await game.deleteOne();
    return NextResponse.json({ success: true });
}
