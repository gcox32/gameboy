import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { StoredPokemon } from '@/models';

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
