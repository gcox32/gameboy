import mongoose from 'mongoose';
import { Game, Notification, Profile, RanchPen, SaveState, StoredPokemon, User } from '@/models';
import { notExpired } from './notifications';
import { emailLimits, type EmailLimit } from './accounts';
import { clampPage, containsText, TEXT_COLLATION, type Page, type PageQuery } from './paging';

/*
 * What the admin view shows about accounts: one row per account for the Users table, and
 * everything one account owns for its own page. Built from users, not profiles, so an account
 * whose profile is missing still shows.
 */

export interface AccountRow {
    userId: string;
    email: string;
    emailVerified: boolean;
    admin: boolean;
    createdAt: Date;
    hasProfile: boolean;
    username: string;
    bio: string;
    avatar?: string;
    games: number;
    saves: number;
    pokemon: number;
    limits: EmailLimit[];
}

type Owned = typeof Game | typeof SaveState | typeof StoredPokemon;

async function countByUser(model: Owned, userIds?: mongoose.Types.ObjectId[]): Promise<Map<string, number>> {
    const rows = await (model as typeof Game).aggregate<{ _id: unknown; count: number }>([
        ...(userIds ? [{ $match: { userId: { $in: userIds } } }] : []),
        { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((r) => [String(r._id), r.count]));
}

/** Account rows, newest first: every account, or just the ones given. */
export async function loadAccounts(userIds?: string[]): Promise<AccountRow[]> {
    const ids = userIds?.map((id) => new mongoose.Types.ObjectId(id));
    const [users, profiles, games, saves, pokemon, limits] = await Promise.all([
        User.find(ids ? { _id: { $in: ids } } : {}).select('email emailVerified admin createdAt').sort({ createdAt: -1 }).lean(),
        Profile.find(ids ? { userId: { $in: ids } } : {}).select('userId username bio avatar').lean(),
        countByUser(Game, ids),
        countByUser(SaveState, ids),
        countByUser(StoredPokemon, ids),
        emailLimits(),
    ]);
    const profileOf = new Map(profiles.map((p) => [String(p.userId), p]));

    return users.map((u) => {
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
    });
}

export const ACCOUNT_SORTS = ['joined', 'email', 'username', 'games', 'saves', 'pokemon'] as const;
export type AccountSort = (typeof ACCOUNT_SORTS)[number];
export const ACCOUNT_FILTERS = ['admin', 'unverified', 'limited'] as const;
export type AccountFilter = (typeof ACCOUNT_FILTERS)[number];

const COUNTED: Partial<Record<AccountSort, Owned>> = { games: Game, saves: SaveState, pokemon: StoredPokemon };

/**
 * One page of account rows, searched by email or username, sorted and filtered on the server.
 * Finds the page's ids first, then builds just those rows.
 */
export async function pageAccounts(query: PageQuery<AccountSort>, filter?: AccountFilter): Promise<Page<AccountRow>> {
    const { q, sort, dir, pageSize } = query;
    const match: Record<string, unknown> = {};
    if (filter === 'admin') match.admin = true;
    if (filter === 'unverified') match.emailVerified = { $ne: true };
    if (filter === 'limited') {
        const blocked = [...(await emailLimits())].filter(([, l]) => l.some((x) => x.blocked)).map(([email]) => email);
        match.email = { $in: blocked };
    }

    // The username lives on the profile, so it's joined in only when searching or sorting by it
    const needsUsername = !!q || sort === 'username';
    const counted = COUNTED[sort];
    const pipeline: mongoose.PipelineStage[] = [
        { $match: match },
        ...(needsUsername ? [
            { $lookup: { from: Profile.collection.name, localField: '_id', foreignField: 'userId', as: 'profile', pipeline: [{ $project: { username: 1 } }] } },
            { $addFields: { username: { $ifNull: [{ $first: '$profile.username' }, ''] } } },
        ] as mongoose.PipelineStage[] : []),
        ...(q ? [{ $match: { $or: [{ email: containsText(q) }, { username: containsText(q) }] } }] : []),
        ...(counted ? [
            { $lookup: { from: counted.collection.name, localField: '_id', foreignField: 'userId', as: 'counted', pipeline: [{ $count: 'n' }] } },
            { $addFields: { sortCount: { $ifNull: [{ $first: '$counted.n' }, 0] } } },
        ] as mongoose.PipelineStage[] : []),
    ];
    const field = counted ? 'sortCount' : sort === 'joined' ? 'createdAt' : sort;

    const run = (page: number) => User.aggregate<{ total: { n: number }[]; ids: { _id: mongoose.Types.ObjectId }[] }>([
        ...pipeline,
        {
            $facet: {
                total: [{ $count: 'n' }],
                ids: [{ $sort: { [field]: dir, _id: dir } }, { $skip: (page - 1) * pageSize }, { $limit: pageSize }, { $project: { _id: 1 } }],
            },
        },
    ]).collation(TEXT_COLLATION);

    let page = query.page;
    let [result] = await run(page);
    const total = result.total[0]?.n ?? 0;
    // Past the end, e.g. after deleting the last row of the last page: send the last page instead
    if (page !== clampPage(page, pageSize, total)) {
        page = clampPage(page, pageSize, total);
        [result] = await run(page);
    }

    const ids = result.ids.map((r) => String(r._id));
    const byId = new Map((ids.length ? await loadAccounts(ids) : []).map((r) => [r.userId, r]));
    return { rows: ids.map((id) => byId.get(id)).filter((r): r is AccountRow => !!r), total, page, pageSize };
}

export interface AccountDetail {
    account: AccountRow;
    games: { id: string; title: string; generation?: number; img?: string; createdAt: Date; saves: number }[];
    saves: { id: string; gameId: string; gameTitle?: string; title: string; filePath: string; img?: string; connected: boolean; updatedAt: Date }[];
    pens: { id: string; name: string; order: number; pokemon: number }[];
    pokemon: {
        id: string; speciesIndex: number; speciesName: string; nickname: string; level: number; generation: number;
        otName: string; penName?: string; sourceGameTitle?: string; transferring: boolean; extractedAt: Date;
    }[];
    notifications: { id: string; type: string; title: string; readAt?: Date; expiresAt?: Date; createdAt: Date }[];
}

/** Everything one account owns, or null if there's no such account. */
export async function loadAccountDetail(userId: string): Promise<AccountDetail | null> {
    const [account] = await loadAccounts([userId]);
    if (!account) return null;

    const [games, saves, pens, pokemon, notifications] = await Promise.all([
        Game.find({ userId }).select('title metadata.generation img createdAt').sort({ createdAt: -1 }).lean(),
        SaveState.find({ userId }).select('gameId title filePath img connected updatedAt').sort({ updatedAt: -1 }).lean(),
        RanchPen.find({ userId }).select('name order').sort({ order: 1 }).lean(),
        StoredPokemon.find({ userId })
            .select('speciesIndex speciesName nickname level generation otName penId sourceGameId status extractedAt')
            .sort({ extractedAt: -1 }).lean(),
        Notification.find({ userId, ...notExpired() }).select('type title readAt expiresAt createdAt').sort({ createdAt: -1 }).lean(),
    ]);

    const gameTitle = new Map(games.map((g) => [String(g._id), g.title]));
    const penName = new Map(pens.map((p) => [String(p._id), p.name]));
    const savesPerGame = new Map<string, number>();
    for (const s of saves) savesPerGame.set(String(s.gameId), (savesPerGame.get(String(s.gameId)) ?? 0) + 1);
    const pokemonPerPen = new Map<string, number>();
    for (const p of pokemon) if (p.penId) pokemonPerPen.set(String(p.penId), (pokemonPerPen.get(String(p.penId)) ?? 0) + 1);

    return {
        account,
        games: games.map((g) => ({
            id: String(g._id), title: g.title, generation: g.metadata?.generation, img: g.img,
            createdAt: g.createdAt, saves: savesPerGame.get(String(g._id)) ?? 0,
        })),
        saves: saves.map((s) => ({
            id: String(s._id), gameId: String(s.gameId), gameTitle: gameTitle.get(String(s.gameId)),
            title: s.title, filePath: s.filePath, img: s.img, connected: s.connected ?? false, updatedAt: s.updatedAt,
        })),
        pens: pens.map((p) => ({ id: String(p._id), name: p.name, order: p.order, pokemon: pokemonPerPen.get(String(p._id)) ?? 0 })),
        pokemon: pokemon.map((p) => ({
            id: String(p._id), speciesIndex: p.speciesIndex, speciesName: p.speciesName, nickname: p.nickname,
            level: p.level, generation: p.generation, otName: p.otName,
            penName: p.penId ? penName.get(String(p.penId)) : undefined,
            // A game deleted since keeps its Pokémon, so the title can be gone
            sourceGameTitle: gameTitle.get(String(p.sourceGameId)),
            transferring: p.status === 'transferring',
            extractedAt: p.extractedAt,
        })),
        notifications: notifications.map((n) => ({
            id: String(n._id), type: n.type, title: n.title, readAt: n.readAt, expiresAt: n.expiresAt, createdAt: n.createdAt,
        })),
    };
}
