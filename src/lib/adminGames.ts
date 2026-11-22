import mongoose from 'mongoose';
import { Game, Profile, SaveState, User, type IGameMetadata } from '@/models';
import { clampPage, containsText, TEXT_COLLATION, type Page, type PageQuery } from './paging';

export const GAME_SORTS = ['added', 'title', 'owner', 'generation'] as const;
export type GameSort = (typeof GAME_SORTS)[number];
/** Generation 1 or 2, or games with none set */
export const GAME_FILTERS = ['1', '2', 'none'] as const;
export type GameFilter = (typeof GAME_FILTERS)[number];

export interface GameRow {
    id: string;
    userId: string;
    title: string;
    filePath: string;
    img?: string;
    metadata?: IGameMetadata;
    createdAt: Date;
    saves: number;
    /** Absent if the account is gone */
    ownerEmail?: string;
    ownerName?: string;
}

/** Joins each game's owner: their email from the account, their username from the profile */
const OWNER_STAGES: mongoose.PipelineStage.FacetPipelineStage[] = [
    { $lookup: { from: User.collection.name, localField: 'userId', foreignField: '_id', as: 'owner', pipeline: [{ $project: { email: 1 } }] } },
    { $lookup: { from: Profile.collection.name, localField: 'userId', foreignField: 'userId', as: 'profile', pipeline: [{ $project: { username: 1 } }] } },
    { $addFields: { ownerEmail: { $first: '$owner.email' }, ownerName: { $first: '$profile.username' } } },
];

const SORT_FIELDS: Record<GameSort, string> = { added: 'createdAt', title: 'title', owner: 'ownerEmail', generation: 'metadata.generation' };

/**
 * One page of every account's games, searched by title, series or owner, sorted and filtered
 * on the server. Owners are joined before paging only when the search or sort needs them.
 */
export async function pageGames(query: PageQuery<GameSort>, filter?: GameFilter): Promise<Page<GameRow>> {
    const { q, sort, dir, pageSize } = query;
    const ownersFirst = !!q || sort === 'owner';

    const match: Record<string, unknown> =
        filter === 'none' ? { 'metadata.generation': { $in: [null] } }
        : filter ? { 'metadata.generation': Number(filter) }
        : {};

    const pipeline: mongoose.PipelineStage[] = [
        { $match: match },
        ...(ownersFirst ? OWNER_STAGES : []),
        ...(q ? [{ $match: { $or: ['title', 'metadata.series', 'ownerEmail', 'ownerName'].map((f) => ({ [f]: containsText(q) })) } }] : []),
    ];

    const run = (page: number) => Game.aggregate<{ total: { n: number }[]; rows: (GameRow & { _id: mongoose.Types.ObjectId; userId: mongoose.Types.ObjectId })[] }>([
        ...pipeline,
        {
            $facet: {
                total: [{ $count: 'n' }],
                rows: [
                    { $sort: { [SORT_FIELDS[sort]]: dir, _id: dir } },
                    { $skip: (page - 1) * pageSize },
                    { $limit: pageSize },
                    ...(ownersFirst ? [] : OWNER_STAGES),
                    { $lookup: { from: SaveState.collection.name, localField: '_id', foreignField: 'gameId', as: 'saveCount', pipeline: [{ $count: 'n' }] } },
                    { $project: { userId: 1, title: 1, filePath: 1, img: 1, metadata: 1, createdAt: 1, ownerEmail: 1, ownerName: 1, saves: { $ifNull: [{ $first: '$saveCount.n' }, 0] } } },
                ],
            },
        },
    ]).collation(TEXT_COLLATION);

    let page = query.page;
    let [result] = await run(page);
    const total = result.total[0]?.n ?? 0;
    if (page !== clampPage(page, pageSize, total)) {
        page = clampPage(page, pageSize, total);
        [result] = await run(page);
    }

    return {
        rows: result.rows.map(({ _id, userId, ...rest }) => ({ ...rest, id: String(_id), userId: String(userId) })),
        total,
        page,
        pageSize,
    };
}
