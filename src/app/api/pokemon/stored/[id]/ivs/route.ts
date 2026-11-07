import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { StoredPokemon } from '@/models';
import { isValidStoredIVs } from '@/utils/pokemon/stats';
import { setBoxMonIVs } from '@/utils/sramWriter';

type Params = { params: Promise<{ id: string }> };

/** Sets a Ranch Pokémon's IVs. It stays at the Ranch; no save is involved. */
export async function POST(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    if (!isValidStoredIVs(body?.ivs)) {
        return NextResponse.json({ error: 'IVs must be whole numbers from 0 to 15' }, { status: 400 });
    }

    await dbConnect();
    const pokemon = await StoredPokemon.findById(id);
    if (!pokemon) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (pokemon.userId.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const before = pokemon.rawBoxData;
    const after = Buffer.from(setBoxMonIVs(before, body.ivs));

    // Only over the bytes just read, and only while it's at the Ranch, so an edit can't
    // undo another made meanwhile or land on a Pokémon that's being moved into a save
    const updated = await StoredPokemon.findOneAndUpdate(
        { _id: id, status: 'stashed', rawBoxData: before },
        { $set: { rawBoxData: after } },
        { returnDocument: 'after' },
    );
    if (!updated) {
        return NextResponse.json({ error: 'That Pokémon changed or is being moved. Check it and try again.' }, { status: 409 });
    }
    return NextResponse.json(updated.toJSON());
}
