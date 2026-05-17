import { NextRequest, NextResponse } from 'next/server';
import { del, put } from '@vercel/blob';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { SaveState, Game, StoredPokemon } from '@/models';
import { extractFromSRAM, SourceSlot } from '@/utils/pokemon/extract';
import { clearSlot } from '@/utils/sramWriter';
import { saveBlobPath } from '@/utils/blobPaths';

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
        slots: SourceSlot[];
    };

    if (!saveStateId || !slots?.length) {
        return NextResponse.json({ error: 'saveStateId and slots are required' }, { status: 400 });
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

    // Fetch the save blob (JSON format: { MBCRam: number[] })
    const res = await fetch(saveState.filePath, { cache: 'no-store' });
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch save file' }, { status: 502 });
    const json = await res.json() as { MBCRam: number[] };
    if (!Array.isArray(json.MBCRam)) {
        return NextResponse.json({ error: 'Save file is missing MBCRam data' }, { status: 502 });
    }
    let sram: Uint8Array = new Uint8Array(json.MBCRam);

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
            otId: extracted.otId,
            level: extracted.level,
            rawBoxData: extracted.rawBoxData,
            extractedAt: new Date(),
            status: 'stashed',
        });
        created.push(stored.toJSON());
    }

    // Upload patched save blob (JSON format: { MBCRam: number[] })
    const oldFilePath = saveState.filePath;
    const blobPath = saveBlobPath(
        session.user.email ?? session.user.id,
        game.title,
        saveState.title ?? 'save',
        saveStateId,
    );
    const patched = Buffer.from(JSON.stringify({ MBCRam: Array.from(sram) }));
    const blob = await put(blobPath, patched, { access: 'public', addRandomSuffix: true });
    await SaveState.updateOne({ _id: saveStateId }, { $set: { filePath: blob.url } });
    try { await del(oldFilePath); } catch { /* non-fatal */ }

    return NextResponse.json({ created, updatedSaveStateId: saveState.id, updatedFilePath: blob.url }, { status: 201 });
}
