'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Text } from '@/components/ui';
import DataTable, { Column } from './DataTable';
import { ensureOk } from './useAdminTable';
import { formatBytes, plural, shortAgo } from './format';
import styles from '@/styles/admin.module.css';

/** One entry as /api/admin/audit sends it */
interface Entry {
    id: string;
    actorId: string;
    actorEmail: string;
    action: string;
    targetUserId?: string;
    targetEmail?: string;
    targetId?: string;
    targetLabel?: string;
    details?: Record<string, unknown>;
    createdAt: string;
}

const ACTION_NAMES: Record<string, string> = {
    'user.update': 'Edited account',
    'user.delete': 'Deleted account',
    'user.resendVerification': 'Resent verification code',
    'user.verifyEmail': 'Marked email verified',
    'user.sendPasswordReset': 'Sent password reset',
    'user.clearRateLimits': 'Cleared rate limits',
    'game.update': 'Edited game',
    'game.delete': 'Deleted game',
    'save.update': 'Edited save',
    'save.delete': 'Deleted save',
    'notification.send': 'Sent notification',
    'notification.delete': 'Deleted notification',
    'storage.deleteOrphans': 'Deleted orphaned files',
};

const GROUPS = [
    { value: '', label: 'All actions' },
    { value: 'user', label: 'Accounts' },
    { value: 'game', label: 'Games' },
    { value: 'save', label: 'Saves' },
    { value: 'notification', label: 'Notifications' },
    { value: 'storage', label: 'Storage' },
];

const exact = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const quoted = (s: unknown) => `"${String(s)}"`;
const num = (v: unknown) => (typeof v === 'number' ? v : 0);

/** What an entry's details say, in a line */
function describe({ action, targetLabel, details: d = {} }: Entry): string {
    const titleChange = d.title as { from: string; to: string } | undefined;
    switch (action) {
        case 'user.update': {
            const parts: string[] = [];
            const admin = d.admin as { to: boolean } | undefined;
            const username = d.username as { from: string | null; to: string } | undefined;
            if (admin) parts.push(admin.to ? 'Made admin' : 'Removed admin');
            if (username) parts.push(`Username ${username.from ? `${quoted(username.from)} → ` : ''}${quoted(username.to)}`);
            if (d.bio) parts.push('Bio changed');
            return parts.join(' · ');
        }
        case 'user.delete':
            return `With ${plural(num(d.games), 'game')}, ${plural(num(d.saves), 'save')}, ${plural(num(d.pokemon), 'Ranch Pokémon', 'Ranch Pokémon')}, ${plural(num(d.files), 'file')}`;
        case 'user.clearRateLimits':
            return `Cleared ${plural(num(d.cleared), 'limit')}`;
        case 'game.update':
        case 'save.update': {
            const changed = (d.changed as string[] | undefined) ?? [];
            const title = titleChange ? `${quoted(titleChange.from)} → ${quoted(titleChange.to)}` : quoted(targetLabel);
            const others = changed.filter((c) => c !== 'title');
            return others.length ? `${title}: changed ${others.join(', ')}` : title;
        }
        case 'game.delete':
            return `${quoted(targetLabel)}, with ${plural(num(d.saves), 'save')}`;
        case 'save.delete':
            return quoted(targetLabel);
        case 'notification.send':
            return typeof d.expiresAt === 'string'
                ? `${quoted(targetLabel)}, expires ${exact.format(new Date(d.expiresAt))}`
                : quoted(targetLabel);
        case 'notification.delete':
            return quoted(targetLabel);
        case 'storage.deleteOrphans': {
            const skipped = num(d.skipped) ? `, skipped ${num(d.skipped)}` : '';
            return `${plural(num(d.files), 'file')}, ${formatBytes(num(d.bytes))}${skipped}`;
        }
        default:
            return targetLabel ? quoted(targetLabel) : '';
    }
}

/** Who an entry was about: an account link, everyone, or nobody in particular */
function Target({ entry }: { entry: Entry }) {
    if (entry.targetUserId) {
        const label = entry.targetEmail ?? 'Deleted account';
        // A deleted account's page is gone, so its name is just text
        return entry.action === 'user.delete'
            ? <span title={entry.targetUserId}>{label}</span>
            : <Link href={`/admin/users/${entry.targetUserId}`} className={styles.rowLink}>{label}</Link>;
    }
    if (entry.details?.to === 'everyone') return <span>Everyone</span>;
    return <span className={styles.muted}>—</span>;
}

interface AuditLogProps {
    /** Only what was done to this account, without the account column or the filter */
    userId?: string;
    pageSize?: number;
    /** Loads again from the newest whenever this changes, e.g. after an action on the page */
    refreshKey?: unknown;
}

/** What admins have done, newest first, a page at a time */
export default function AuditLog({ userId, pageSize = 50, refreshKey }: AuditLogProps) {
    const [group, setGroup] = useState('');
    const [entries, setEntries] = useState<Entry[]>([]);
    const [next, setNext] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPage = useCallback(async (before?: string) => {
        const params = new URLSearchParams({ limit: String(pageSize) });
        if (userId) params.set('userId', userId);
        if (group) params.set('group', group);
        if (before) params.set('before', before);
        const res = await ensureOk(await fetch(`/api/admin/audit?${params}`), 'Failed to load the activity log');
        return res.json() as Promise<{ entries: Entry[]; next: string | null }>;
    }, [userId, group, pageSize]);

    const load = useCallback(async (before?: string) => {
        setLoading(true);
        setError(null);
        try {
            const page = await fetchPage(before);
            setEntries((prev) => (before ? [...prev, ...page.entries] : page.entries));
            setNext(page.next);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [fetchPage]);

    useEffect(() => { load(); }, [load, refreshKey]);

    // Kept in the order the server sends: sorting one page would misstate the rest
    const columns: Column<Entry>[] = [
        {
            key: 'when', header: 'When', width: '10rem',
            render: (e) => <span title={exact.format(new Date(e.createdAt))}>{shortAgo(e.createdAt)}</span>,
        },
        { key: 'admin', header: 'Admin', render: (e) => <span title={e.actorEmail}>{e.actorEmail}</span> },
        { key: 'action', header: 'Action', width: '17rem', wrap: true, render: (e) => ACTION_NAMES[e.action] ?? e.action },
        ...(userId ? [] : [{ key: 'target', header: 'Account', render: (e: Entry) => <Target entry={e} /> }]),
        { key: 'details', header: 'Details', width: '26rem', wrap: true, render: (e) => describe(e) || <span className={styles.muted}>—</span> },
    ];

    return (
        <div>
            {error && <Alert variation="error" onDismiss={() => setError(null)}>{error}</Alert>}
            {!userId && (
                <div className={styles.scanBar}>
                    <label className={styles.filterLabel}>
                        <span>Show</span>
                        <select value={group} onChange={(e) => setGroup(e.target.value)} className={styles.searchInput}>
                            {GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                        </select>
                    </label>
                </div>
            )}
            <DataTable
                data={entries}
                columns={columns}
                rowKey={(e) => e.id}
                loading={loading && entries.length === 0}
                emptyMessage={group ? 'Nothing of this kind yet' : 'No admin activity yet'}
                compact
            />
            {next && (
                <div className={styles.loadMore}>
                    <button type="button" className={styles.modalCancelButton} onClick={() => load(next)} disabled={loading}>
                        {loading ? 'Loading…' : 'Show older'}
                    </button>
                </div>
            )}
            {!next && entries.length > 0 && (
                <Text fontSize="sm" variation="secondary" className={styles.loadMore}>
                    That&apos;s everything{userId ? ' for this account' : ''}.
                </Text>
            )}
        </div>
    );
}
