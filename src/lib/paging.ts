/*
 * Paging for the admin tables: a page number and size, a search, and a sort the server applies,
 * so a table never loads more than one page of rows.
 */

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export interface PageQuery<S extends string> {
    page: number;
    pageSize: number;
    /** Trimmed search text, or '' for none */
    q: string;
    sort: S;
    dir: 1 | -1;
}

export interface Page<T> {
    rows: T[];
    /** How many match, across every page */
    total: number;
    /** The page sent, which is the last one when the one asked for is past the end */
    page: number;
    pageSize: number;
}

/** Reads paging from a URL's query, falling back to the defaults for anything missing or unknown */
export function parsePaging<S extends string>(
    params: URLSearchParams,
    sorts: readonly S[],
    defaults: { sort: S; dir: 1 | -1 },
): PageQuery<S> {
    const int = (name: string, fallback: number) => {
        const n = Math.floor(Number(params.get(name)));
        return Number.isFinite(n) && n >= 1 ? n : fallback;
    };
    const sort = params.get('sort') as S;
    const dir = params.get('dir');
    return {
        page: int('page', 1),
        pageSize: Math.min(int('pageSize', DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE),
        q: (params.get('q') ?? '').trim().slice(0, 200),
        sort: sorts.includes(sort) ? sort : defaults.sort,
        dir: dir === 'asc' ? 1 : dir === 'desc' ? -1 : defaults.dir,
    };
}

/** The page to send: the one asked for, or the last one if that's past the end */
export function clampPage(page: number, pageSize: number, total: number): number {
    return Math.min(page, Math.max(1, Math.ceil(total / pageSize)));
}

/** A case-insensitive "contains" match for user-typed text */
export const containsText = (text: string) => new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

/** Sorts text as people expect: case and accents ignored, numbers in order */
export const TEXT_COLLATION = { locale: 'en', strength: 2, numericOrdering: true } as const;
