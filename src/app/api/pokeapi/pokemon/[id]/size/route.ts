import { NextResponse } from 'next/server';

/**
 * Just a Pokémon's height (decimetres) and weight (hectograms), from PokéAPI. The full
 * /pokemon/[id] route returns the whole record and its species, which is a lot to send for two numbers.
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const dexNo = Number(id);
    if (!Number.isInteger(dexNo) || dexNo < 1) {
        return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${dexNo}/`, { cache: 'force-cache' });
        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch pokemon' }, { status: res.status });
        }
        const { height, weight } = await res.json() as { height: number; weight: number };
        return NextResponse.json(
            { height, weight },
            // A species' size never changes, so browsers can keep it for good
            { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
        );
    } catch {
        return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
    }
}
