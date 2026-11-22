'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui';

/** Throws the API's own error message for a failed response, or `fallback` if it has none. */
export async function ensureOk(res: Response, fallback: string): Promise<Response> {
    if (res.ok) return res;
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? fallback);
}

/** Every user's username by user id, in one request. Users since deleted are simply absent. */
export async function fetchUsernames(): Promise<Record<string, string>> {
    const res = await ensureOk(await fetch('/api/admin/users'), 'Failed to load usernames');
    const users: { userId: string; username: string }[] = await res.json();
    return Object.fromEntries(users.filter((u) => u.username).map((u) => [u.userId, u.username]));
}

/**
 * Loading something for an admin panel, and running changes to it. Changes set `saving`, not
 * `loading`, so what's shown stays in place behind an open modal. `load` should be stable
 * (module-level or useCallback): a new one loads again.
 */
export function useAdminData<T>(load: () => Promise<T>, initial: T) {
    const [data, setData] = useState<T>(initial);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

    const reload = useCallback(async () => {
        try {
            setError(null);
            setData(await load());
        } catch (err) {
            setError((err as Error).message);
            console.error(err);
        } finally {
            setLoading(false);
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

    return { data, loading, saving, error, setError, reload, run };
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
