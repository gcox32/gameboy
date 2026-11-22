import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { dbConnect } from '@/lib/db';
import { emailLimits } from '@/lib/accounts';
import { Game, Profile, SaveState, StoredPokemon, User } from '@/models';

type Counts = Map<string, number>;

async function countByUser(model: typeof Game | typeof SaveState | typeof StoredPokemon): Promise<Counts> {
    const rows = await (model as typeof Game).aggregate<{ _id: unknown; count: number }>([
        { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((r) => [String(r._id), r.count]));
}

// GET /api/admin/users — every account, with its profile, what it owns, and any open rate limits.
// Built from users, not profiles, so an account whose profile is missing still shows.
export async function GET() {
    const { denied } = await requireAdmin();
    if (denied) return denied;

    await dbConnect();
    const [users, profiles, games, saves, pokemon, limits] = await Promise.all([
        User.find().select('email emailVerified admin createdAt').sort({ createdAt: -1 }).lean(),
        Profile.find().select('userId username bio avatar').lean(),
        countByUser(Game),
        countByUser(SaveState),
        countByUser(StoredPokemon),
        emailLimits(),
    ]);
    const profileOf = new Map(profiles.map((p) => [String(p.userId), p]));

    return NextResponse.json(users.map((u) => {
        const id = String(u._id);
        const profile = profileOf.get(id);
        return {
            userId: id,
            email: u.email,
            emailVerified: u.emailVerified ?? false,
            admin: u.admin ?? false,
            createdAt: u.createdAt,
            hasProfile: !!profile,
            username: profile?.username ?? '',
            bio: profile?.bio ?? '',
            avatar: profile?.avatar,
            games: games.get(id) ?? 0,
            saves: saves.get(id) ?? 0,
            pokemon: pokemon.get(id) ?? 0,
            limits: limits.get(u.email) ?? [],
        };
    }));
}
