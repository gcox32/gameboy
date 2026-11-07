import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { RanchPen } from '@/models';
import { PEN_NAME_MAX, penJSON, penOccupants } from '@/lib/ranch';

type Params = { params: Promise<{ id: string }> };

/** Renames a pen */
export async function PATCH(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > PEN_NAME_MAX) {
        return NextResponse.json({ error: `Pen names need 1 to ${PEN_NAME_MAX} characters` }, { status: 400 });
    }

    await dbConnect();
    const pen = await RanchPen.findOneAndUpdate(
        { _id: id, userId: session.user.id },
        { $set: { name } },
        { returnDocument: 'after' },
    );
    if (!pen) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(penJSON(pen));
}

/** Closes an empty pen. A full one has to be emptied first, and the last pen always stays. */
export async function DELETE(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await dbConnect();
    const pen = await RanchPen.findOne({ _id: id, userId });
    if (!pen) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (await RanchPen.countDocuments({ userId }) <= 1) {
        return NextResponse.json({ error: 'The Ranch needs at least one pen' }, { status: 422 });
    }
    if (await penOccupants(userId, pen._id) > 0) {
        return NextResponse.json({ error: 'Move the Pokémon out of this pen first' }, { status: 409 });
    }

    // A Pokémon moved in meanwhile isn't lost: the Ranch settles it into another pen
    await pen.deleteOne();
    return NextResponse.json({ success: true });
}
