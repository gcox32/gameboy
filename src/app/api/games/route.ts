import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Game } from '@/models';

// GET /api/games — the signed-in user's games. Admins page through everyone's at /api/admin/games.
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const games = await Game.find({ userId: session.user.id }).sort({ createdAt: -1 });
    return NextResponse.json(games.map(g => g.toJSON()));
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, filePath = '', img, metadata } = body;

    if (!title) {
        return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    await dbConnect();
    const game = await Game.create({
        userId: session.user.id,
        title,
        filePath,
        img,
        metadata,
    });

    return NextResponse.json(game.toJSON(), { status: 201 });
}
