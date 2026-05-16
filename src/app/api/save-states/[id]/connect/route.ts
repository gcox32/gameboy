import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { User, SaveState } from '@/models';
import { SRAMParser } from '@/utils/sramParser';

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

    // Persist connected: true FIRST so it survives even if the blob upload below fails.
    // Use updateOne/$set to bypass Mongoose model-cache issues during development HMR.
    await SaveState.updateOne({ _id: id }, { $set: { connected: true } });

    // Patch the save file with the appTrainerId. Non-fatal: if this fails, the save state
    // is still marked connected and the user can work with the original file.
    try {
        const fileRes = await fetch(saveState.filePath);
        if (!fileRes.ok) throw new Error(`Fetch failed: ${fileRes.status}`);

        const json = await fileRes.json() as { MBCRam: number[] };
        if (!Array.isArray(json.MBCRam)) throw new Error('Save file is missing MBCRam');

        const sram = new Uint8Array(json.MBCRam);

        // Trainer ID is stored little-endian on the Game Boy
        sram[0x2605] = appTrainerId & 0xFF;
        sram[0x2606] = (appTrainerId >> 8) & 0xFF;

        const parser = new SRAMParser(Array.from(sram));
        sram[0x3523] = parser.calculateMainDataChecksum();

        const patched = Buffer.from(JSON.stringify({ MBCRam: Array.from(sram) }));
        const blobPath = `saves/${session.user.id}/${id}/save.sav`;
        const blob = await put(blobPath, patched, { access: 'public', addRandomSuffix: false, allowOverwrite: true });

        await SaveState.updateOne({ _id: id }, { $set: { filePath: blob.url } });
    } catch (err) {
        console.error('[connect] File patching failed — save state is still marked connected:', err);
    }

    const updated = await SaveState.findById(id);
    return NextResponse.json({ saveState: updated!.toJSON(), appTrainerId });
}
