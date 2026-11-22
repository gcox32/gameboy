'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { Alert, Text } from '@/components/ui';
import DataTable, { Column } from './DataTable';
import { ensureOk } from './useAdminTable';
import styles from '@/styles/admin.module.css';

interface Stats {
    users: { total: number; unverified: number; admins: number; newThisWeek: number };
    games: { total: number; gen1: number; gen2: number; unset: number };
    saves: number;
    ranch: { pokemon: number; pens: number };
    notifications: { broadcasts: number; direct: number };
    signupsByWeek: { week: string; count: number }[];
    unverified: { id: string; email: string; createdAt: string }[];
    unverifiedShown: number;
}

interface StoreUsage {
    store: 'private' | 'public';
    error?: string;
    folders: { folder: string; files: number; bytes: number }[];
}

// Checked with the dataviz validator against the admin panel surface (#11152a): passes the
// lightness, chroma and 3:1 contrast checks, where the darker accent #7b68a6 reads as gray.
const BAR = '#9a86d0';
const BAR_HOVER = '#b4a5dd';
const GRID = 'rgba(255, 255, 255, 0.07)';
const MUTED_TEXT = 'rgba(255, 255, 255, 0.5)';

const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat();
const weekLabel = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
const dateLabel = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = bytes / 1024, i = 0;
    while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
    return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

function daysAgo(iso: string): string {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    return days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
}

const plural = (n: number, one: string, many = `${one}s`) => `${whole.format(n)} ${n === 1 ? one : many}`;

function StatTile({ label, value, detail }: { label: string; value: string; detail?: string | null }) {
    return (
        <div className={styles.statTile}>
            <div className={styles.statLabel}>{label}</div>
            <div className={styles.statValue}>{value}</div>
            {detail && <div className={styles.statDetail}>{detail}</div>}
        </div>
    );
}

function SignupsChart({ weeks }: { weeks: Stats['signupsByWeek'] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const font = { family: getComputedStyle(document.body).fontFamily, size: 11 };
        const chart = new Chart(canvasRef.current, {
            type: 'bar',
            data: {
                labels: weeks.map((w) => weekLabel.format(new Date(w.week))),
                datasets: [{
                    data: weeks.map((w) => w.count),
                    backgroundColor: BAR,
                    hoverBackgroundColor: BAR_HOVER,
                    maxBarThickness: 24,
                    // Rounded at the data end, square on the baseline
                    borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
                    borderSkipped: 'start',
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                // The whole column slot is the hover target, not just the bar
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        displayColors: false,
                        titleFont: font,
                        bodyFont: font,
                        callbacks: {
                            title: (items) => `Week of ${items[0].label}`,
                            label: (item) => plural(Number(item.raw), 'sign-up'),
                        },
                    },
                },
                scales: {
                    x: { grid: { display: false }, border: { color: GRID }, ticks: { color: MUTED_TEXT, font, maxRotation: 0, autoSkipPadding: 16 } },
                    y: {
                        beginAtZero: true,
                        border: { display: false },
                        grid: { color: GRID, lineWidth: 1 },
                        ticks: { color: MUTED_TEXT, font, precision: 0, maxTicksLimit: 5 },
                    },
                },
            },
        });
        return () => chart.destroy();
    }, [weeks]);

    const total = weeks.reduce((sum, w) => sum + w.count, 0);
    return (
        <section className={styles.overviewCard} aria-labelledby="signups-title">
            <h3 id="signups-title" className={styles.cardTitle}>Sign-ups per week</h3>
            <p className={styles.cardSubtitle}>{plural(total, 'sign-up')} in the last {weeks.length} weeks</p>
            <div className={styles.chartBox}>
                <canvas ref={canvasRef} role="img" aria-label={`Sign-ups per week for the last ${weeks.length} weeks, ${total} in total. A table follows.`} />
            </div>
            <details className={styles.tableView}>
                <summary>Show as table</summary>
                <table>
                    <thead><tr><th scope="col">Week of</th><th scope="col">Sign-ups</th></tr></thead>
                    <tbody>
                        {weeks.map((w) => (
                            <tr key={w.week}><td>{weekLabel.format(new Date(w.week))}</td><td>{w.count}</td></tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </section>
    );
}

function StoragePanel({ stores }: { stores: StoreUsage[] | null }) {
    if (!stores) {
        return (
            <section className={styles.overviewCard}>
                <h3 className={styles.cardTitle}>Storage</h3>
                <p className={styles.cardSubtitle}>Adding up files…</p>
            </section>
        );
    }

    // Folders summed across both stores, largest first
    const totals = new Map<string, { files: number; bytes: number }>();
    for (const s of stores) for (const f of s.folders) {
        const t = totals.get(f.folder) ?? { files: 0, bytes: 0 };
        totals.set(f.folder, { files: t.files + f.files, bytes: t.bytes + f.bytes });
    }
    const folders = [...totals].map(([folder, t]) => ({ folder, ...t })).sort((a, b) => b.bytes - a.bytes);
    const largest = Math.max(1, ...folders.map((f) => f.bytes));
    const storeLine = (s: StoreUsage) => {
        const name = s.store === 'private' ? 'Private store' : 'Public store (older files)';
        if (s.error) return `${name}: ${s.error.toLowerCase()}`;
        const bytes = s.folders.reduce((sum, f) => sum + f.bytes, 0);
        const files = s.folders.reduce((sum, f) => sum + f.files, 0);
        return `${name}: ${formatBytes(bytes)} in ${plural(files, 'file')}`;
    };

    return (
        <section className={styles.overviewCard} aria-labelledby="storage-title">
            <h3 id="storage-title" className={styles.cardTitle}>Storage by folder</h3>
            <p className={styles.cardSubtitle}>User uploads, across both blob stores</p>
            {folders.length === 0 ? <Text variation="secondary">No stores could be listed.</Text> : (
                <ul className={styles.meterList}>
                    {folders.map((f) => (
                        <li key={f.folder}>
                            <span className={styles.meterName}>{f.folder}</span>
                            <span className={styles.meterTrack} aria-hidden="true">
                                <span className={styles.meterFill} style={{ width: `${(f.bytes / largest) * 100}%` }} />
                            </span>
                            <span className={styles.meterFigure}>{formatBytes(f.bytes)} · {plural(f.files, 'file')}</span>
                        </li>
                    ))}
                </ul>
            )}
            <ul className={styles.storeNotes}>
                {stores.map((s) => <li key={s.store}>{storeLine(s)}</li>)}
            </ul>
        </section>
    );
}

const unverifiedColumns: Column<Stats['unverified'][number]>[] = [
    { key: 'email', header: 'Email', sortValue: (u) => u.email },
    {
        key: 'createdAt',
        header: 'Signed up',
        sortValue: (u) => u.createdAt,
        render: (u) => <span title={dateLabel.format(new Date(u.createdAt))}>{daysAgo(u.createdAt)}</span>,
    },
];

export default function OverviewPanel() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [stores, setStores] = useState<StoreUsage[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setError(null);
        // Storage lists every blob, so it fills in on its own rather than holding up the rest
        fetch('/api/admin/storage')
            .then((r) => ensureOk(r, 'Failed to load storage'))
            .then((r) => r.json())
            .then(setStores)
            .catch((err) => { setStores([]); setError(err.message); });
        try {
            const res = await ensureOk(await fetch('/api/admin/stats'), 'Failed to load stats');
            setStats(await res.json());
        } catch (err) {
            setError((err as Error).message);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const storageBytes = stores?.flatMap((s) => s.folders).reduce((sum, f) => sum + f.bytes, 0);
    const storageFiles = stores?.flatMap((s) => s.folders).reduce((sum, f) => sum + f.files, 0);

    return (
        <div className={styles.overview}>
            {error && <Alert variation="error" onDismiss={() => setError(null)}>{error}</Alert>}

            <div className={styles.statGrid}>
                <StatTile
                    label="Users"
                    value={stats ? compact.format(stats.users.total) : '…'}
                    detail={stats && `${whole.format(stats.users.newThisWeek)} new this week · ${plural(stats.users.admins, 'admin')}`}
                />
                <StatTile
                    label="Unverified"
                    value={stats ? compact.format(stats.users.unverified) : '…'}
                    detail={stats && (stats.users.total ? `${Math.round((stats.users.unverified / stats.users.total) * 100)}% of users` : undefined)}
                />
                <StatTile
                    label="Games"
                    value={stats ? compact.format(stats.games.total) : '…'}
                    detail={stats && `Gen 1: ${whole.format(stats.games.gen1)} · Gen 2: ${whole.format(stats.games.gen2)}${stats.games.unset ? ` · Not set: ${whole.format(stats.games.unset)}` : ''}`}
                />
                <StatTile label="Saves" value={stats ? compact.format(stats.saves) : '…'} />
                <StatTile
                    label="Ranch Pokémon"
                    value={stats ? compact.format(stats.ranch.pokemon) : '…'}
                    detail={stats && `in ${plural(stats.ranch.pens, 'pen')}`}
                />
                <StatTile
                    label="Storage"
                    value={storageBytes === undefined ? '…' : formatBytes(storageBytes)}
                    detail={storageFiles === undefined ? undefined : plural(storageFiles, 'file')}
                />
            </div>

            <div className={styles.overviewRow}>
                {stats ? <SignupsChart weeks={stats.signupsByWeek} /> : <section className={styles.overviewCard} aria-busy="true" />}
                <StoragePanel stores={stores} />
            </div>

            <section className={styles.overviewCard} aria-labelledby="unverified-title">
                <h3 id="unverified-title" className={styles.cardTitle}>Unverified accounts</h3>
                <p className={styles.cardSubtitle}>
                    {stats && stats.users.unverified > stats.unverifiedShown
                        ? `The ${stats.unverifiedShown} newest of ${whole.format(stats.users.unverified)}`
                        : 'Signed up but never entered their code'}
                </p>
                <DataTable
                    data={stats?.unverified ?? []}
                    columns={unverifiedColumns}
                    rowKey={(u) => u.id}
                    loading={!stats}
                    emptyMessage="Everyone has verified"
                    compact
                />
            </section>
        </div>
    );
}
