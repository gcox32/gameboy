import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { RanchPen } from '@/models';
import { MAX_PENS, PEN_NAME_MAX, addPen, penJSON } from '@/lib/ranch';

/** Opens a new, empty pen after the last one. The name is optional. */
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (name.length > PEN_NAME_MAX) {
        return NextResponse.json({ error: `Pen names can be up to ${PEN_NAME_MAX} characters` }, { status: 400 });
    }

    await dbConnect();
    const pens = await RanchPen.find({ userId: session.user.id }).sort({ order: 1 });
    if (pens.length >= MAX_PENS) {
        return NextResponse.json({ error: `The Ranch has room for ${MAX_PENS} pens` }, { status: 422 });
    }

    const pen = await addPen(session.user.id, pens, name || undefined);
    return NextResponse.json(penJSON(pen), { status: 201 });
}
