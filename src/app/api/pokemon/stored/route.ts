import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { User, SaveState, Game, StoredPokemon } from '@/models';
import { EmptySlotError, cloneToRanch, recoverStaleTransfers, sendToRanch } from '@/lib/pokemonTransfer';
import { SAVE_CHANGED_MESSAGE, loadGen1Save } from '@/lib/saveFile';
import { BOX_UNAVAILABLE_MESSAGE, PARTY_BASE, SaveSlot, isSlotAvailable, isValidSlot } from '@/utils/pokemon/gen1Save';
import { hasTrainerId, stampTrainerId } from '@/utils/sramWriter';
import { loadRom } from '@/lib/romMoves';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter: Record<string, unknown> = { userId: session.user.id, status: 'stashed' };

    const generation = searchParams.get('generation');
    if (generation) filter.generation = Number(generation);

    const speciesIndex = searchParams.get('speciesIndex');
    if (speciesIndex) filter.speciesIndex = Number(speciesIndex);

    await dbConnect();
    await recoverStaleTransfers(session.user.id);
    const pokemon = await StoredPokemon.find(filter).sort({ extractedAt: -1 });
    return NextResponse.json(pokemon.map(p => p.toJSON()));
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { saveStateId, slots, expectedFilePath, mode = 'move' } = body as {
        saveStateId: string;
        slots: SaveSlot[];
        expectedFilePath: string;   // the file the client read these slots from
        /** 'clone' stashes copies and leaves the save as it is */
        mode?: 'move' | 'clone';
    };

    if (!saveStateId || !expectedFilePath || !Array.isArray(slots) || !slots.length) {
        return NextResponse.json({ error: 'saveStateId, expectedFilePath and slots are required' }, { status: 400 });
    }
    if (mode !== 'move' && mode !== 'clone') {
        return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }
    if (!slots.every(isValidSlot)) {
        return NextResponse.json({ error: 'Invalid slot' }, { status: 400 });
    }
    const slotKeys = new Set(slots.map(s => `${s.location}-${s.boxNumber ?? 0}-${s.slotIndex}`));
    if (slotKeys.size !== slots.length) {
        return NextResponse.json({ error: 'Duplicate slots' }, { status: 400 });
    }

    await dbConnect();
    const saveState = await SaveState.findById(saveStateId);
    if (!saveState) return NextResponse.json({ error: 'Save state not found' }, { status: 404 });
    if (saveState.userId.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!saveState.connected) {
        return NextResponse.json({ error: 'Save state must be connected to Oak\'s Lab first' }, { status: 422 });
    }
    // Slots are only indexes, so they only mean something in the file they were read from.
    if (saveState.filePath !== expectedFilePath) {
        return NextResponse.json({ error: SAVE_CHANGED_MESSAGE }, { status: 409 });
    }

    const game = await Game.findById(saveState.gameId);
    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

    // The ROM is only for the moves' details, so it loads alongside and may come back empty
    const [loaded, rom] = await Promise.all([loadGen1Save(saveState, game), loadRom(game)]);
    if (loaded.error !== undefined) {
        return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    }
    let sram: Uint8Array = loaded.sram;

    if (!slots.every(s => isSlotAvailable(sram, s))) {
        return NextResponse.json({ error: BOX_UNAVAILABLE_MESSAGE }, { status: 422 });
    }

    if (mode === 'clone') {
        try {
            const created = await cloneToRanch({ userId: session.user.id, saveState, source: sram, slots, rom });
            return NextResponse.json({
                created: created.map(p => p.toJSON()),
                updatedSaveStateId: saveState.id,
                updatedFilePath: saveState.filePath,
            }, { status: 201 });
        } catch (err) {
            if (err instanceof EmptySlotError) {
                return NextResponse.json({ error: SAVE_CHANGED_MESSAGE }, { status: 409 });
            }
            throw err;
        }
    }

    // Once the player has a Pokémon, the party must keep at least one.
    const partyCount = sram[PARTY_BASE];
    const partySlots = slots.filter(s => s.location === 'party').length;
    if (partySlots > 0 && partySlots >= partyCount) {
        return NextResponse.json({ error: 'At least one Pokémon must stay in the party' }, { status: 422 });
    }

    // Repair saves connected before the Player ID byte-order fix.
    const user = await User.findById(session.user.id);
    if (user?.appTrainerId !== undefined && !hasTrainerId(sram, user.appTrainerId)) {
        sram = stampTrainerId(sram, user.appTrainerId);
    }

    try {
        const result = await sendToRanch({
            userId: session.user.id,
            saveState,
            source: sram,
            slots,
            rom,
            owner: { identity: session.user.email ?? session.user.id, gameTitle: game.title },
        });
        if (!result.ok) {
            return NextResponse.json({ error: SAVE_CHANGED_MESSAGE }, { status: 409 });
        }
        return NextResponse.json({
            created: result.created.map(p => p.toJSON()),
            updatedSaveStateId: saveState.id,
            updatedFilePath: result.updatedFilePath,
        }, { status: 201 });
    } catch (err) {
        if (err instanceof EmptySlotError) {
            return NextResponse.json({ error: SAVE_CHANGED_MESSAGE }, { status: 409 });
        }
        throw err;
    }
}
