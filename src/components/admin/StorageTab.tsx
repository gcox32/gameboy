'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Alert, Text } from '@/components/ui';
import DataTable, { Column } from './DataTable';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { useAdminData, ensureOk } from './useAdminTable';
import { dateLabel, formatBytes, plural, shortAgo } from './format';
import styles from '@/styles/admin.module.css';

type Store = 'private' | 'public';

interface Orphan {
    url: string;
    pathname: string;
    size: number;
    uploadedAt: string;
    store: Store;
    folder: string;
    ownerId?: string;
    ownerEmail?: string;
}

interface Missing {
    url: string;
    kind: 'rom' | 'cover' | 'save' | 'screenshot' | 'avatar' | 'transfer';
    label: string;
    userId: string;
    store: Store;
}

interface Report {
    stores: { store: Store; error?: string; files: number }[];
    orphans: Orphan[];
    recent: number;
    missing: Missing[];
}

interface DeleteResult {
    deleted: { url: string; size: number }[];
    skipped: { url: string; reason: string }[];
}

const STORE_NAMES: Record<Store, string> = { private: 'Private', public: 'Public' };
const KIND_NAMES: Record<Missing['kind'], string> = {
    rom: 'Game ROM', cover: 'Game cover', save: 'Save file', screenshot: 'Save screenshot', avatar: 'Avatar', transfer: 'Ranch move',
};

/** The path below the folder and owner, which is the part that tells files apart */
const shortPath = (pathname: string) => pathname.split('/').slice(2).join('/') || pathname;

// Nothing loads until asked: a scan lists every file in both stores
const noScan = async (): Promise<Report | null> => null;

export default function StorageTab() {
    // Only for running the scan and deletes; the report is held here, set by each scan
    const { saving, error, setError, run } = useAdminData<Report | null>(noScan, null);
    const [current, setCurrent] = useState<Report | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [confirming, setConfirming] = useState(false);

    const scan = () => run(
        async () => {
            const res = await ensureOk(await fetch('/api/admin/storage/orphans'), 'Scan failed');
            const next: Report = await res.json();
            setCurrent(next);
            setSelected(new Set());
            return next;
        },
        (r) => (r.orphans.length ? `Found ${plural(r.orphans.length, 'orphaned file')}` : 'No orphaned files'),
        'Scan failed',
        { reload: false },
    );

    const deleteSelected = async () => {
        const urls = [...selected];
        let result: DeleteResult | null = null;
        await run(
            async () => {
                const res = await ensureOk(await fetch('/api/admin/storage/orphans', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ urls }),
                }), 'Delete failed');
                result = await res.json();
                return result as DeleteResult;
            },
            (r) => {
                const freed = r.deleted.reduce((sum, d) => sum + d.size, 0);
                const skipped = r.skipped.length ? `, skipped ${r.skipped.length} no longer orphaned` : '';
                return `Deleted ${plural(r.deleted.length, 'file')}, freeing ${formatBytes(freed)}${skipped}`;
            },
            'Delete failed',
            { reload: false },
        );
        setConfirming(false);
        // Scan again so the list shows what's really left
        if (result) await scan();
    };

    const orphans = current?.orphans ?? [];
    const selectedBytes = useMemo(
        () => orphans.filter((o) => selected.has(o.url)).reduce((sum, o) => sum + o.size, 0),
        [orphans, selected],
    );
    const totalBytes = orphans.reduce((sum, o) => sum + o.size, 0);
    const allSelected = orphans.length > 0 && selected.size === orphans.length;

    const toggle = (url: string) => setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(url)) next.delete(url); else next.add(url);
        return next;
    });

    const orphanColumns: Column<Orphan>[] = [
        {
            key: 'select',
            width: '4rem',
            header: (
                <input
                    type="checkbox"
                    aria-label="Select all orphaned files"
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(orphans.map((o) => o.url)))}
                    className={styles.checkbox}
                />
            ),
            render: (o) => (
                <input type="checkbox" aria-label={`Select ${o.pathname}`} checked={selected.has(o.url)} onChange={() => toggle(o.url)} className={styles.checkbox} />
            ),
        },
        { key: 'folder', header: 'Folder', width: '10rem', sortValue: (o) => o.folder },
        { key: 'path', header: 'File', sortValue: (o) => o.pathname, render: (o) => <span className={styles.mono} title={o.pathname}>{shortPath(o.pathname)}</span> },
        {
            key: 'owner', header: 'Folder owner', sortValue: (o) => o.ownerEmail ?? '',
            render: (o) => o.ownerId
                ? <Link href={`/admin/users/${o.ownerId}`} className={styles.rowLink} title={o.ownerEmail}>{o.ownerEmail}</Link>
                : <span className={styles.muted}>No account</span>,
        },
        { key: 'store', header: 'Store', width: '14rem', sortValue: (o) => o.store, render: (o) => STORE_NAMES[o.store] },
        { key: 'size', header: 'Size', width: '10rem', sortValue: (o) => o.size, render: (o) => <span className={styles.numeric}>{formatBytes(o.size)}</span> },
        {
            key: 'uploaded', header: 'Uploaded', width: '11rem', sortValue: (o) => o.uploadedAt,
            render: (o) => <span title={dateLabel.format(new Date(o.uploadedAt))}>{shortAgo(o.uploadedAt)}</span>,
        },
    ];

    const missingColumns: Column<Missing>[] = [
        { key: 'kind', header: 'Missing', width: '16rem', sortValue: (m) => m.kind, render: (m) => KIND_NAMES[m.kind] },
        { key: 'label', header: 'Of', sortValue: (m) => m.label },
        {
            key: 'user', header: 'Account', width: '9rem',
            render: (m) => <Link href={`/admin/users/${m.userId}`} className={styles.rowLink}>View</Link>,
        },
        { key: 'store', header: 'Store', width: '14rem', sortValue: (m) => m.store, render: (m) => STORE_NAMES[m.store] },
        { key: 'url', header: 'Points to', render: (m) => <span className={styles.mono} title={m.url}>{shortPath(new URL(m.url).pathname.slice(1))}</span> },
    ];

    return (
        <div className={styles.overview}>
            {error && <Alert variation="error" onDismiss={() => setError(null)}>{error}</Alert>}

            <section className={styles.overviewCard} aria-labelledby="orphan-title">
                <h3 id="orphan-title" className={styles.cardTitle}>Orphaned files</h3>
                <p className={styles.cardSubtitle}>
                    Files in the games, saves and avatars folders that no game, save, profile or Ranch move points to,
                    left by deletes and replacements that didn&apos;t finish. Files under a day old are left out,
                    since an upload is stored a moment before its record.
                </p>
                <div className={styles.scanBar}>
                    <button type="button" className={styles.modalCancelButton} onClick={scan} disabled={saving}>
                        {saving && !confirming ? 'Scanning…' : current ? 'Scan again' : 'Scan both stores'}
                    </button>
                    {current && (
                        <Text fontSize="sm" variation="secondary">
                            {current.stores.map((s) => `${STORE_NAMES[s.store]}: ${s.error ? s.error.toLowerCase() : plural(s.files, 'file')}`).join(' · ')}
                            {current.recent > 0 && ` · ${plural(current.recent, 'recent file')} skipped`}
                        </Text>
                    )}
                </div>

                {current && (
                    <>
                        <div className={styles.scanBar}>
                            <Text>
                                {orphans.length
                                    ? `${plural(orphans.length, 'orphaned file')}, ${formatBytes(totalBytes)}`
                                    : 'No orphaned files.'}
                            </Text>
                            {orphans.length > 0 && (
                                <button
                                    type="button"
                                    className={styles.modalDeleteButton}
                                    disabled={saving || selected.size === 0}
                                    onClick={() => setConfirming(true)}
                                >
                                    Delete {selected.size ? `${plural(selected.size, 'file')} (${formatBytes(selectedBytes)})` : 'selected'}
                                </button>
                            )}
                        </div>
                        {orphans.length > 0 && (
                            <DataTable data={orphans} columns={orphanColumns} rowKey={(o) => o.url} compact />
                        )}
                    </>
                )}
            </section>

            {current && (
                <section className={styles.overviewCard} aria-labelledby="missing-title">
                    <h3 id="missing-title" className={styles.cardTitle}>Missing files</h3>
                    <p className={styles.cardSubtitle}>
                        Records pointing at a file that isn&apos;t in its store. These won&apos;t load for their owner;
                        fix them from the account&apos;s page. Only stores that could be listed are checked.
                    </p>
                    <DataTable data={current.missing} columns={missingColumns} rowKey={(m) => `${m.kind}:${m.url}`} emptyMessage="Every record's file is there" compact />
                </section>
            )}

            <ConfirmDeleteModal
                isOpen={confirming}
                onClose={() => setConfirming(false)}
                onConfirm={deleteSelected}
                title="Delete Orphaned Files"
                message={`Each file is checked again first, and any that something now points to is kept. This can't be undone.`}
                itemName={`${plural(selected.size, 'file')}, ${formatBytes(selectedBytes)}`}
                loading={saving}
            />
        </div>
    );
}
