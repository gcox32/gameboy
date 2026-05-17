import { NextRequest, NextResponse } from 'next/server';
import { del, put } from '@vercel/blob';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { User, SaveState, StoredPokemon, Game } from '@/models';
import { injectPokemon } from '@/utils/sramWriter';
import { saveBlobPath } from '@/utils/blobPaths';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { targetSaveStateId, targetSlot } = body;

    if (!targetSaveStateId || !targetSlot) {
        return NextResponse.json({ error: 'targetSaveStateId and targetSlot are required' }, { status: 400 });
    }

    await dbConnect();

    const pokemon = await StoredPokemon.findById(id);
    if (!pokemon) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (pokemon.userId.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (pokemon.status !== 'stashed') {
        return NextResponse.json({ error: 'Pokémon is not currently stashed at the Ranch' }, { status: 422 });
    }

    const saveState = await SaveState.findById(targetSaveStateId);
    if (!saveState) return NextResponse.json({ error: 'Save state not found' }, { status: 404 });
    if (saveState.userId.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!saveState.connected) {
        return NextResponse.json({ error: 'Target save state must be connected to Oak\'s Lab first' }, { status: 422 });
    }

    const user = await User.findById(session.user.id);
    if (!user?.appTrainerId) {
        return NextResponse.json({ error: 'User does not have an App Trainer ID' }, { status: 422 });
    }

    // Fetch save blob (JSON format: { MBCRam: number[] })
    const res = await fetch(saveState.filePath, { cache: 'no-store' });
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch save file' }, { status: 502 });
    const json = await res.json() as { MBCRam: number[] };
    if (!Array.isArray(json.MBCRam)) {
        return NextResponse.json({ error: 'Save file is missing MBCRam data' }, { status: 502 });
    }
    const sram = new Uint8Array(json.MBCRam);

    // Inject the Pokémon into the target slot
    const rawBoxData = Buffer.from(pokemon.rawBoxData);
    let patched: Uint8Array;
    try {
        patched = injectPokemon(sram, rawBoxData, pokemon.nickname, pokemon.otName, user.appTrainerId, targetSlot);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Inject failed';
        return NextResponse.json({ error: msg }, { status: 422 });
    }

    // Upload patched save (JSON format: { MBCRam: number[] })
    const oldFilePath = saveState.filePath;
    const game = await Game.findById(saveState.gameId);
    const blobPath = saveBlobPath(
        session.user.email ?? session.user.id,
        game?.title ?? 'game',
        saveState.title ?? 'save',
        targetSaveStateId,
    );
    const patchedJson = Buffer.from(JSON.stringify({ MBCRam: Array.from(patched) }));
    const blob = await put(blobPath, patchedJson, { access: 'public', addRandomSuffix: true });

    saveState.filePath = blob.url;
    await saveState.save();
    try { await del(oldFilePath); } catch { /* non-fatal */ }

    pokemon.status = 'in_game';
    pokemon.currentGameId = saveState.gameId;
    pokemon.rawBoxData = Buffer.from(rawBoxData);
    await pokemon.save();

    return NextResponse.json({
        pokemon: pokemon.toJSON(),
        updatedSaveStateId: saveState.id,
        updatedFilePath: blob.url,
    });
}
