import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { commitSave, loadGen1Save, removeBlob, SAVE_CHANGED_MESSAGE, uploadSave } from '@/lib/saveFile';
import { Game, SaveState, User } from '@/models';
import { BOX_UNAVAILABLE_MESSAGE, isSlotAvailable, isSlotOccupied, isValidSlot } from '@/utils/pokemon/gen1Save';
import { isValidStoredIVs } from '@/utils/pokemon/stats';
import { hasTrainerId, setPokemonIVs, stampTrainerId } from '@/utils/sramWriter';

type Params = { params: Promise<{ id: string }> };

// Sets a Pokémon's IVs where it sits in the save, without moving it.
export async function POST(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { slot, ivs, expectedFilePath } = await req.json();

    if (!isValidSlot(slot)) {
        return NextResponse.json({ error: 'Invalid slot' }, { status: 400 });
    }
    if (!isValidStoredIVs(ivs)) {
        return NextResponse.json({ error: 'IVs must be whole numbers from 0 to 15' }, { status: 400 });
    }
    if (typeof expectedFilePath !== 'string' || !expectedFilePath) {
        return NextResponse.json({ error: 'expectedFilePath is required' }, { status: 400 });
    }

    await dbConnect();
    const saveState = await SaveState.findById(id);
    if (!saveState) return NextResponse.json({ error: 'Save state not found' }, { status: 404 });
    if (saveState.userId.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!saveState.connected) {
        return NextResponse.json({ error: 'Save state must be connected to Oak\'s Lab first' }, { status: 422 });
    }
    // A slot is only an index, so it only means something in the file it was read from.
    if (saveState.filePath !== expectedFilePath) {
        return NextResponse.json({ error: SAVE_CHANGED_MESSAGE }, { status: 409 });
    }

    const game = await Game.findById(saveState.gameId);
    const loaded = await loadGen1Save(saveState, game);
    if (loaded.error !== undefined) {
        return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    }
    let sram: Uint8Array = loaded.sram;

    if (!isSlotAvailable(sram, slot)) {
        return NextResponse.json({ error: BOX_UNAVAILABLE_MESSAGE }, { status: 422 });
    }
    if (!isSlotOccupied(sram, slot)) {
        return NextResponse.json({ error: SAVE_CHANGED_MESSAGE }, { status: 409 });
    }

    // Repair saves connected before the Player ID byte-order fix.
    const user = await User.findById(session.user.id);
    if (user?.appTrainerId !== undefined && !hasTrainerId(sram, user.appTrainerId)) {
        sram = stampTrainerId(sram, user.appTrainerId);
    }

    const updatedFilePath = await uploadSave(saveState, setPokemonIVs(sram, slot, ivs), {
        identity: session.user.email ?? session.user.id,
        gameTitle: game?.title ?? 'game',
    });
    if (!await commitSave(saveState, updatedFilePath)) {
        await removeBlob(updatedFilePath);
        return NextResponse.json({ error: SAVE_CHANGED_MESSAGE }, { status: 409 });
    }
    await removeBlob(saveState.filePath);

    return NextResponse.json({ updatedFilePath });
}
