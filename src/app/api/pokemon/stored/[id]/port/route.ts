import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { User, SaveState, StoredPokemon, Game } from '@/models';
import { portToSave } from '@/lib/pokemonTransfer';
import { SAVE_CHANGED_MESSAGE, loadGen1Save } from '@/lib/saveFile';
import { BOX_UNAVAILABLE_MESSAGE, isSlotAvailable, isValidSlot } from '@/utils/pokemon/gen1Save';
import { encodeNameString } from '@/utils/sramParser';
import { hasTrainerId, injectPokemon, stampTrainerId } from '@/utils/sramWriter';

type Params = { params: Promise<{ id: string }> };

const NOT_AT_RANCH_MESSAGE = 'That Pokémon is no longer at the Ranch.';

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
    if (!isValidSlot(targetSlot)) {
        return NextResponse.json({ error: 'Invalid targetSlot' }, { status: 400 });
    }

    await dbConnect();

    const pokemon = await StoredPokemon.findById(id);
    if (!pokemon) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (pokemon.userId.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (pokemon.status !== 'stashed') {
        return NextResponse.json({ error: NOT_AT_RANCH_MESSAGE }, { status: 409 });
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

    const game = await Game.findById(saveState.gameId);
    const loaded = await loadGen1Save(saveState, game);
    if (loaded.error !== undefined) {
        return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    }
    let sram: Uint8Array = loaded.sram;

    if (!isSlotAvailable(sram, targetSlot)) {
        return NextResponse.json({ error: BOX_UNAVAILABLE_MESSAGE }, { status: 422 });
    }

    // Repair saves connected before the Player ID byte-order fix.
    if (!hasTrainerId(sram, user.appTrainerId)) {
        sram = stampTrainerId(sram, user.appTrainerId);
    }

    // Inject the Pokémon into the target slot
    const rawBoxData = Buffer.from(pokemon.rawBoxData);
    // Records stored before name bytes were kept only have the decoded strings.
    const names = {
        nickname: pokemon.nicknameBytes ? Buffer.from(pokemon.nicknameBytes) : encodeNameString(pokemon.nickname),
        otName: pokemon.otNameBytes ? Buffer.from(pokemon.otNameBytes) : encodeNameString(pokemon.otName),
    };
    let patched: Uint8Array;
    try {
        patched = injectPokemon(sram, rawBoxData, names, user.appTrainerId, targetSlot);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Inject failed';
        return NextResponse.json({ error: msg }, { status: 422 });
    }

    const result = await portToSave({
        pokemonId: pokemon._id,
        userId: session.user.id,
        saveState,
        patched,
        owner: { identity: session.user.email ?? session.user.id, gameTitle: game?.title ?? 'game' },
    });
    if (!result.ok) {
        return result.reason === 'save_changed'
            ? NextResponse.json({ error: SAVE_CHANGED_MESSAGE }, { status: 409 })
            : NextResponse.json({ error: NOT_AT_RANCH_MESSAGE }, { status: 409 });
    }

    return NextResponse.json({
        updatedSaveStateId: saveState.id,
        updatedFilePath: result.updatedFilePath,
    });
}
