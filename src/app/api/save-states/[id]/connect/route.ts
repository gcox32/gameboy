import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { User, SaveState, Game } from '@/models';
import { SAVE_CHANGED_MESSAGE, commitSave, loadGen1Save, removeBlob, uploadSave } from '@/lib/saveFile';
import { stampTrainerId } from '@/utils/sramWriter';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const saveState = await SaveState.findById(id);
    if (!saveState) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (saveState.userId.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Ensure the user has an appTrainerId
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!user.appTrainerId) {
        let trainerId: number;
        let attempts = 0;
        do {
            trainerId = Math.floor(Math.random() * 65536);
            const exists = await User.exists({ appTrainerId: trainerId });
            if (!exists) break;
            attempts++;
        } while (attempts < 10);
        await User.updateOne({ _id: session.user.id }, { $set: { appTrainerId: trainerId! } });
        user.appTrainerId = trainerId!;
    }

    const appTrainerId = user.appTrainerId!;

    // If already connected, return the current state (idempotent — no 409 error)
    if (saveState.connected) {
        return NextResponse.json({ saveState: saveState.toJSON(), appTrainerId });
    }

    // Load before changing anything, so a file that isn't a Gen 1 save is left alone
    // and the save state stays unconnected.
    const game = await Game.findById(saveState.gameId);
    const loaded = await loadGen1Save(saveState, game);
    if (loaded.error !== undefined) {
        return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    }

    // Stamp appTrainerId into Player ID field and all existing Pokémon OT IDs
    const sram = stampTrainerId(loaded.sram, appTrainerId);
    const newFilePath = await uploadSave(saveState, sram, {
        identity: session.user.email ?? session.user.id,
        gameTitle: game?.title ?? 'game',
    });
    if (!await commitSave(saveState, newFilePath, { connected: true })) {
        await removeBlob(newFilePath);
        return NextResponse.json({ error: SAVE_CHANGED_MESSAGE }, { status: 409 });
    }
    await removeBlob(saveState.filePath);

    const updated = await SaveState.findById(id);
    return NextResponse.json({ saveState: updated!.toJSON(), appTrainerId });
}
