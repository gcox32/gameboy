import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { isValidObjectId } from 'mongoose';
import { RanchPen, StoredPokemon } from '@/models';
import { PEN_CAPACITY, penOccupants } from '@/lib/ranch';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const pokemon = await StoredPokemon.findById(id);

    if (!pokemon) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (pokemon.userId.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(pokemon.toJSON());
}

/** Moves a Pokémon to another of the user's pens, if it has room */
export async function PATCH(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const penId = body?.penId;
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (typeof penId !== 'string' || !isValidObjectId(penId)) {
        return NextResponse.json({ error: 'penId is required' }, { status: 400 });
    }

    await dbConnect();
    const pen = await RanchPen.findOne({ _id: penId, userId });
    if (!pen) return NextResponse.json({ error: 'Pen not found' }, { status: 404 });

    const pokemon = await StoredPokemon.findById(id);
    if (!pokemon) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (pokemon.userId.toString() !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (pokemon.penId?.toString() === penId) return NextResponse.json(pokemon.toJSON());

    // Two moves into the last space at once can overfill a pen by one, which does no harm
    if (await penOccupants(userId, pen._id) >= PEN_CAPACITY) {
        return NextResponse.json({ error: `${pen.name} is full` }, { status: 409 });
    }

    const moved = await StoredPokemon.findOneAndUpdate(
        { _id: id, status: 'stashed' },
        { $set: { penId: pen._id } },
        { returnDocument: 'after' },
    );
    if (!moved) {
        return NextResponse.json({ error: 'That Pokémon is being moved right now' }, { status: 409 });
    }
    return NextResponse.json(moved.toJSON());
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const pokemon = await StoredPokemon.findById(id);

    if (!pokemon) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (pokemon.userId.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Conditional so a release can't race a port of the same Pokémon
    const { deletedCount } = await StoredPokemon.deleteOne({ _id: id, status: 'stashed' });
    if (!deletedCount) {
        return NextResponse.json({ error: 'That Pokémon is being moved right now' }, { status: 409 });
    }
    return NextResponse.json({ success: true });
}
