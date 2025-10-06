import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    try {
        const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${id}/`;
        const pokemonRes = await fetch(pokemonUrl, { cache: 'force-cache' });
        if (!pokemonRes.ok) {
            return NextResponse.json({ error: 'Failed to fetch pokemon' }, { status: pokemonRes.status });
        }
        const pokemon = await pokemonRes.json();

        let species = null;
        try {
            const speciesRes = await fetch(pokemon?.species?.url, { cache: 'force-cache' });
            if (speciesRes.ok) {
                species = await speciesRes.json();
            }
        } catch (_) {
            // ignore species fetch errors; pokemon data is primary
        }

        return NextResponse.json({ pokemon, species });
    } catch (error) {
        return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
    }
}


