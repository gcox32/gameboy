import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { dbConnect } from '@/lib/db';
import { ACCOUNT_FILTERS, ACCOUNT_SORTS, pageAccounts, type AccountFilter } from '@/lib/adminUsers';
import { parsePaging } from '@/lib/paging';

// GET /api/admin/users?page=&pageSize=&q=&sort=&dir=&filter= — a page of accounts, with what
// each owns and any open rate limits. q matches email or username; filter is admin, unverified or limited.
export async function GET(req: NextRequest) {
    const { denied } = await requireAdmin();
    if (denied) return denied;

    const params = req.nextUrl.searchParams;
    const filter = params.get('filter');
    if (filter && !ACCOUNT_FILTERS.includes(filter as AccountFilter)) {
        return NextResponse.json({ error: `filter must be one of ${ACCOUNT_FILTERS.join(', ')}` }, { status: 400 });
    }

    await dbConnect();
    const query = parsePaging(params, ACCOUNT_SORTS, { sort: 'joined', dir: -1 });
    return NextResponse.json(await pageAccounts(query, (filter as AccountFilter) || undefined));
}
