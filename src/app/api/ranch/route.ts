import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { StoredPokemon } from '@/models';
import { recoverStaleTransfers } from '@/lib/pokemonTransfer';
import { PEN_CAPACITY, penJSON, settleRanch } from '@/lib/ranch';

/** Everything the Ranch page shows: the pens, in order, and every Pokémon at the Ranch with its pen */
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    await dbConnect();
    await recoverStaleTransfers(userId);
    const pens = await settleRanch(userId);
    const pokemon = await StoredPokemon.find({ userId, status: 'stashed' }).sort({ extractedAt: 1 });

    return NextResponse.json({
        capacity: PEN_CAPACITY,
        pens: pens.map(penJSON),
        pokemon: pokemon.map(p => p.toJSON()),
    });
}
