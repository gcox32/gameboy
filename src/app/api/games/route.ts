import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Game } from '@/models';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';

    if (all && !session.user.admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const filter = all ? {} : { userId: session.user.id };
    const games = await Game.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(games.map(g => g.toJSON()));
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, filePath, img, metadata } = body;

    if (!title || !filePath) {
        return NextResponse.json({ error: 'title and filePath are required' }, { status: 400 });
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
