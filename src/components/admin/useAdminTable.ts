'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui';

/** Both functions should be stable (module-level or useCallback): a new `load` reloads the table. */
interface Options<T> {
    /** Fetches the rows. Throw to show an error. */
    load: () => Promise<T[]>;
    /** The text of a row that the search box matches against */
    searchText: (item: T) => (string | null | undefined)[];
}

/** Throws the API's own error message for a failed response, or `fallback` if it has none. */
export async function ensureOk(res: Response, fallback: string): Promise<Response> {
    if (res.ok) return res;
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? fallback);
}

/** Every user's username by user id, in one request. Users since deleted are simply absent. */
export async function fetchUsernames(): Promise<Record<string, string>> {
    const res = await ensureOk(await fetch('/api/profiles?all=true'), 'Failed to load usernames');
    const profiles: { userId: string; username: string }[] = await res.json();
    return Object.fromEntries(profiles.map((p) => [String(p.userId), p.username]));
}

/**
 * State shared by the admin tables: loading rows, searching them, and running changes. Changes
 * set `saving`, not `loading`, so the table stays in place behind an open modal.
 */
export function useAdminTable<T>({ load, searchText }: Options<T>) {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { showToast } = useToast();

    const reload = useCallback(async () => {
        try {
            setError(null);
            setItems(await load());
        } catch (err) {
            setError((err as Error).message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [load]);

    useEffect(() => { reload(); }, [reload]);

    const rows = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return items;
        return items.filter((item) => searchText(item).some((s) => s?.toLowerCase().includes(term)));
    }, [items, searchTerm, searchText]);

    /**
     * Runs a change, then reloads. Shows `success` as a toast, or the error in the table's alert.
     * Resolves to whether it worked, so a modal can stay open on failure.
     */
    const run = useCallback(async (action: () => Promise<unknown>, success: string, failure: string): Promise<boolean> => {
        setSaving(true);
        setError(null);
        try {
            await action();
            showToast(success, 'success');
            await reload();
            return true;
        } catch (err) {
            setError(`${failure}: ${(err as Error).message}`);
            console.error(err);
            return false;
        } finally {
            setSaving(false);
        }
    }, [reload, showToast]);

    return { items, rows, loading, saving, error, setError, searchTerm, setSearchTerm, reload, run };
}
