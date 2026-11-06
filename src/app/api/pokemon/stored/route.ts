import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { User, SaveState, Game, StoredPokemon } from '@/models';
import { loadGen1Save, storeSave } from '@/lib/saveFile';
import { extractFromSRAM } from '@/utils/pokemon/extract';
import { BOX_UNAVAILABLE_MESSAGE, PARTY_BASE, SaveSlot, isSlotAvailable, isValidSlot } from '@/utils/pokemon/gen1Save';
import { clearSlot, hasTrainerId, stampTrainerId } from '@/utils/sramWriter';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter: Record<string, unknown> = { userId: session.user.id };

    const generation = searchParams.get('generation');
    if (generation) filter.generation = Number(generation);

    const status = searchParams.get('status') ?? 'stashed';
    filter.status = status;

    const speciesIndex = searchParams.get('speciesIndex');
    if (speciesIndex) filter.speciesIndex = Number(speciesIndex);

    await dbConnect();
    const pokemon = await StoredPokemon.find(filter).sort({ extractedAt: -1 });
    return NextResponse.json(pokemon.map(p => p.toJSON()));
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { saveStateId, slots } = body as {
        saveStateId: string;
        slots: SaveSlot[];
    };

    if (!saveStateId || !Array.isArray(slots) || !slots.length) {
        return NextResponse.json({ error: 'saveStateId and slots are required' }, { status: 400 });
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

    const game = await Game.findById(saveState.gameId);
    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

    const loaded = await loadGen1Save(saveState, game);
    if (loaded.error !== undefined) {
        return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    }
    let sram: Uint8Array = loaded.sram;

    if (!slots.every(s => isSlotAvailable(sram, s))) {
        return NextResponse.json({ error: BOX_UNAVAILABLE_MESSAGE }, { status: 422 });
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

    // Sort slots in reverse order so clearing doesn't shift remaining indices
    // (party slots cleared high-to-low; box slots within same box cleared high-to-low)
    const sortedSlots = [...slots].sort((a, b) => {
        if (a.location !== b.location) return a.location === 'party' ? -1 : 1;
        if (a.location === 'box' && b.location === 'box') {
            if (a.boxNumber !== b.boxNumber) return (b.boxNumber ?? 0) - (a.boxNumber ?? 0);
        }
        return b.slotIndex - a.slotIndex;
    });

    const created: object[] = [];

    for (const slot of sortedSlots) {
        const extracted = extractFromSRAM(sram, slot);
        sram = clearSlot(sram, slot);

        const stored = await StoredPokemon.create({
            userId: session.user.id,
            sourceGameId: saveState.gameId,
            generation: 1,
            sourceSlot: slot,
            speciesIndex: extracted.speciesIndex,
            speciesName: extracted.speciesName,
            nickname: extracted.nickname,
            otName: extracted.otName,
            nicknameBytes: extracted.nicknameBytes,
            otNameBytes: extracted.otNameBytes,
            otId: extracted.otId,
            level: extracted.level,
            rawBoxData: extracted.rawBoxData,
            extractedAt: new Date(),
            status: 'stashed',
        });
        created.push(stored.toJSON());
    }

    const updatedFilePath = await storeSave(saveState, sram, {
        identity: session.user.email ?? session.user.id,
        gameTitle: game.title,
    });

    return NextResponse.json({ created, updatedSaveStateId: saveState.id, updatedFilePath }, { status: 201 });
}
