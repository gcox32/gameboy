import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { dbConnect } from '@/lib/db';
import { GAME_FILTERS, GAME_SORTS, pageGames, type GameFilter } from '@/lib/adminGames';
import { parsePaging } from '@/lib/paging';

// GET /api/admin/games?page=&pageSize=&q=&sort=&dir=&generation= — a page of every account's
// games, with each one's owner and save count. q matches title, series, or the owner's email or username.
export async function GET(req: NextRequest) {
    const { denied } = await requireAdmin();
    if (denied) return denied;

    const params = req.nextUrl.searchParams;
    const generation = params.get('generation');
    if (generation && !GAME_FILTERS.includes(generation as GameFilter)) {
        return NextResponse.json({ error: `generation must be one of ${GAME_FILTERS.join(', ')}` }, { status: 400 });
    }

    await dbConnect();
    const query = parsePaging(params, GAME_SORTS, { sort: 'added', dir: -1 });
    return NextResponse.json(await pageGames(query, (generation as GameFilter) || undefined));
}
