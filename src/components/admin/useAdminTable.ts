'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { TableSort } from './DataTable';
import { useToast } from '@/components/ui';

/** Throws the API's own error message for a failed response, or `fallback` if it has none. */
export async function ensureOk(res: Response, fallback: string): Promise<Response> {
    if (res.ok) return res;
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? fallback);
}

/**
 * Loading something for an admin panel, and running changes to it. Changes set `saving`, not
 * `loading`, so what's shown stays in place behind an open modal. `load` should be stable
 * (module-level or useCallback): a new one loads again.
 */
export function useAdminData<T>(load: () => Promise<T>, initial: T) {
    const [data, setData] = useState<T>(initial);
    const [loading, setLoading] = useState(true);
    /** Any load in flight, the first or a later one; what's shown stays meanwhile */
    const [fetching, setFetching] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();
    // Only the latest load's answer is used: an older one arriving late would show the wrong page
    const latest = useRef(0);

    const reload = useCallback(async () => {
        const mine = ++latest.current;
        setFetching(true);
        try {
            setError(null);
            const next = await load();
            if (mine === latest.current) setData(next);
        } catch (err) {
            if (mine === latest.current) setError((err as Error).message);
            console.error(err);
        } finally {
            if (mine === latest.current) {
                setLoading(false);
                setFetching(false);
            }
        }
    }, [load]);

    useEffect(() => { reload(); }, [reload]);

    /**
     * Runs a change, then reloads unless told not to. Shows `success` as a toast (given the
     * action's result, it can use the server's own message), or the error in the panel's alert.
     * Resolves to whether it worked, so a modal can stay open on failure.
     */
    const run = useCallback(async <R,>(
        action: () => Promise<R>,
        success: string | ((result: R) => string),
        failure: string,
        { reload: reloadAfter = true }: { reload?: boolean } = {},
    ): Promise<boolean> => {
        setSaving(true);
        setError(null);
        try {
            const result = await action();
            showToast(typeof success === 'function' ? success(result) : success, 'success');
            if (reloadAfter) await reload();
            return true;
        } catch (err) {
            setError(`${failure}: ${(err as Error).message}`);
            console.error(err);
            return false;
        } finally {
            setSaving(false);
        }
    }, [reload, showToast]);

    return { data, loading, fetching, saving, error, setError, reload, run };
}

/** Both functions should be stable (module-level or useCallback). */
interface TableOptions<T> {
    /** Fetches the rows. Throw to show an error. */
    load: () => Promise<T[]>;
    /** The text of a row that the search box matches against */
    searchText: (item: T) => (string | null | undefined)[];
}

const NO_ROWS: never[] = [];

/** An admin table: its rows, loaded and searchable, and changes to them. */
export function useAdminTable<T>({ load, searchText }: TableOptions<T>) {
    const { data: items, ...rest } = useAdminData<T[]>(load, NO_ROWS);
    const [searchTerm, setSearchTerm] = useState('');

    const rows = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return items;
        return items.filter((item) => searchText(item).some((s) => s?.toLowerCase().includes(term)));
    }, [items, searchTerm, searchText]);

    return { items, rows, searchTerm, setSearchTerm, ...rest };
}

/** One page of rows, as the paged admin routes send them */
export interface PageData<T> {
    rows: T[];
    total: number;
    page: number;
    pageSize: number;
}

interface PagedOptions {
    /** The admin route, e.g. '/api/admin/users' */
    endpoint: string;
    /** The query parameter the filter is sent as, if the table has one */
    filterParam?: string;
    defaultSort: TableSort;
    pageSize?: number;
    failure: string;
}

const SEARCH_DELAY_MS = 300;

/**
 * An admin table paged, searched and sorted by the server. Search waits for a pause in typing,
 * and a new search, sort or filter goes back to the first page.
 */
export function usePagedTable<T>({ endpoint, filterParam, defaultSort, pageSize = 25, failure }: PagedOptions) {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [q, setQ] = useState('');
    const [sort, setSortState] = useState<TableSort>(defaultSort);
    const [filter, setFilterState] = useState('');

    useEffect(() => {
        const term = searchTerm.trim();
        if (term === q) return;
        const timer = setTimeout(() => { setQ(term); setPage(1); }, SEARCH_DELAY_MS);
        return () => clearTimeout(timer);
    }, [searchTerm, q]);

    const load = useCallback(async (): Promise<PageData<T>> => {
        const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort: sort.key, dir: sort.direction });
        if (q) params.set('q', q);
        if (filter && filterParam) params.set(filterParam, filter);
        return (await ensureOk(await fetch(`${endpoint}?${params}`), failure)).json();
    }, [endpoint, filterParam, failure, page, pageSize, sort, q, filter]);

    const empty = useMemo<PageData<T>>(() => ({ rows: [], total: 0, page: 1, pageSize }), [pageSize]);
    const { data, ...rest } = useAdminData<PageData<T>>(load, empty);

    return {
        ...rest,
        rows: data.rows,
        total: data.total,
        // What the server sent, which is the last page if the one asked for is gone
        page: data.page,
        pageSize: data.pageSize,
        setPage,
        searchTerm,
        setSearchTerm,
        /** True while the search box holds text not searched for yet */
        searchPending: searchTerm.trim() !== q,
        sort,
        setSort: (next: TableSort) => { setSortState(next); setPage(1); },
        filter,
        setFilter: (next: string) => { setFilterState(next); setPage(1); },
    };
}
