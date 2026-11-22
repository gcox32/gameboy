import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { dbConnect } from '@/lib/db';
import { Game, Notification, RanchPen, SaveState, StoredPokemon, User } from '@/models';

const WEEKS = 12;
const DAY = 24 * 60 * 60 * 1000;

/** Monday 00:00 UTC of the week holding `date` */
function weekStart(date: Date): Date {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d;
}

// GET /api/admin/stats — totals and recent sign-ups for the admin overview
export async function GET() {
    const { denied } = await requireAdmin();
    if (denied) return denied;

    await dbConnect();
    const now = new Date();
    const firstWeek = new Date(weekStart(now).getTime() - (WEEKS - 1) * 7 * DAY);

    const [
        users, unverifiedCount, admins, newThisWeek,
        games, gamesByGeneration, saves, pokemon, pens,
        broadcasts, directNotifications, recentSignups, unverified,
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ emailVerified: { $ne: true } }),
        User.countDocuments({ admin: true }),
        User.countDocuments({ createdAt: { $gte: new Date(now.getTime() - 7 * DAY) } }),
        Game.countDocuments(),
        Game.aggregate<{ _id: number | null; count: number }>([{ $group: { _id: '$metadata.generation', count: { $sum: 1 } } }]),
        SaveState.countDocuments(),
        StoredPokemon.countDocuments(),
        RanchPen.countDocuments(),
        Notification.countDocuments({ userId: 'BROADCAST' }),
        Notification.countDocuments({ userId: { $ne: 'BROADCAST' } }),
        User.find({ createdAt: { $gte: firstWeek } }).select('createdAt').lean(),
        User.find({ emailVerified: { $ne: true } }).select('email createdAt').sort({ createdAt: -1 }).limit(25).lean(),
    ]);

    // Every week in the range, including the empty ones, oldest first
    const signupsByWeek = Array.from({ length: WEEKS }, (_, i) => ({
        week: new Date(firstWeek.getTime() + i * 7 * DAY).toISOString().slice(0, 10),
        count: 0,
    }));
    for (const u of recentSignups) {
        const i = Math.round((weekStart(u.createdAt).getTime() - firstWeek.getTime()) / (7 * DAY));
        if (signupsByWeek[i]) signupsByWeek[i].count++;
    }

    const byGeneration = (gen: number) => gamesByGeneration.find((g) => Number(g._id) === gen)?.count ?? 0;

    return NextResponse.json({
        users: { total: users, unverified: unverifiedCount, admins, newThisWeek },
        games: { total: games, gen1: byGeneration(1), gen2: byGeneration(2), unset: games - byGeneration(1) - byGeneration(2) },
        saves,
        ranch: { pokemon, pens },
        notifications: { broadcasts, direct: directNotifications },
        signupsByWeek,
        unverified: unverified.map((u) => ({ id: String(u._id), email: u.email, createdAt: u.createdAt })),
        unverifiedShown: Math.min(unverifiedCount, 25),
    });
}
