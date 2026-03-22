import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { SaveState } from '@/models';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');

    await dbConnect();
    const filter: Record<string, unknown> = { userId: session.user.id };
    if (gameId) filter.gameId = gameId;

    const saveStates = await SaveState.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(saveStates.map(s => s.toJSON()));
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { gameId, title, description, filePath, img } = body;

    if (!gameId || !title || !filePath) {
        return NextResponse.json({ error: 'gameId, title and filePath are required' }, { status: 400 });
    }

    await dbConnect();
    const saveState = await SaveState.create({
        userId: session.user.id,
        gameId,
        title,
        description,
        filePath,
        img,
    });

    return NextResponse.json(saveState.toJSON(), { status: 201 });
}
