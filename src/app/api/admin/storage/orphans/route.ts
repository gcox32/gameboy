import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { dbConnect } from '@/lib/db';
import { deleteOrphans, findOrphans } from '@/lib/orphans';
import { recordAudit } from '@/lib/audit';

// GET /api/admin/storage/orphans — files no record points to, and records whose file is gone.
// Lists every file in both stores, so it can take a while.
export async function GET() {
    const { denied } = await requireAdmin();
    if (denied) return denied;

    await dbConnect();
    return NextResponse.json(await findOrphans());
}

const MAX_PER_REQUEST = 500;

// POST /api/admin/storage/orphans { urls } — deletes those of them still orphaned, checking
// again first, so a stale or hand-made list can't remove a file that's in use
export async function POST(req: NextRequest) {
    const { session, denied } = await requireAdmin();
    if (denied) return denied;

    const { urls } = await req.json().catch(() => ({})) as { urls?: unknown };
    if (!Array.isArray(urls) || urls.length === 0 || !urls.every((u) => typeof u === 'string')) {
        return NextResponse.json({ error: 'urls must be a non-empty list of file URLs' }, { status: 400 });
    }
    if (urls.length > MAX_PER_REQUEST) {
        return NextResponse.json({ error: `At most ${MAX_PER_REQUEST} files at a time` }, { status: 400 });
    }

    await dbConnect();
    const result = await deleteOrphans(urls);
    if (result.deleted.length) {
        await recordAudit(session, {
            action: 'storage.deleteOrphans',
            details: {
                files: result.deleted.length,
                bytes: result.deleted.reduce((sum, d) => sum + d.size, 0),
                skipped: result.skipped.length,
                // Paths, not URLs: enough to say which, and the files are gone
                paths: result.deleted.map((d) => new URL(d.url).pathname.slice(1)),
            },
        });
    }
    return NextResponse.json(result);
}
