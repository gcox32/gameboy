import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { dbConnect } from '@/lib/db';
import { loadAccounts } from '@/lib/adminUsers';

// GET /api/admin/users — every account, with what it owns and any open rate limits
export async function GET() {
    const { denied } = await requireAdmin();
    if (denied) return denied;

    await dbConnect();
    return NextResponse.json(await loadAccounts());
}
