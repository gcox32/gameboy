import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { userFolderUsage } from '@/lib/blob';

// GET /api/admin/storage — files and bytes per user folder, per store. Lists every blob, so it's
// fetched separately from the stats and can take a moment.
export async function GET() {
    const { denied } = await requireAdmin();
    if (denied) return denied;
    return NextResponse.json(await userFolderUsage());
}
