import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { requireAdmin } from '@/lib/requireAdmin';
import { dbConnect } from '@/lib/db';
import { AUDIT_GROUPS, listAudit } from '@/lib/audit';

// GET /api/admin/audit?userId=&group=&before=&limit= — what admins have done, newest first.
// Pages by cursor: pass the last response's `next` as `before`.
export async function GET(req: NextRequest) {
    const { denied } = await requireAdmin();
    if (denied) return denied;

    const params = req.nextUrl.searchParams;
    const userId = params.get('userId') ?? undefined;
    const group = params.get('group') ?? undefined;
    if (userId && !isValidObjectId(userId)) return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    if (group && !AUDIT_GROUPS.includes(group)) {
        return NextResponse.json({ error: `group must be one of ${AUDIT_GROUPS.join(', ')}` }, { status: 400 });
    }

    await dbConnect();
    return NextResponse.json(await listAudit({
        userId,
        group,
        before: params.get('before') ?? undefined,
        limit: Number(params.get('limit')) || undefined,
    }));
}
