'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaDownload, FaTrash } from 'react-icons/fa';
import { Alert, Flex, Text } from '@/components/ui';
import { blobReadUrl } from '@/utils/blobUpload';
import { downloadSav } from '@/utils/downloadSav';
import { usePokemonSprites } from '@/hooks/usePokemonSprites';
import { useAuth } from '@/contexts/AuthContext';
import SidebarNavigation from '@/components/admin/SidebarNavigation';
import { AdminDashboard, AdminMain, AdminHeader, AdminContent } from '@/components/admin/AdminLayout';
import AccountPanel, { isLimited, postAccountAction, type AccountAction, type UserRow } from '@/components/admin/AccountPanel';
import DataTable, { Column } from '@/components/admin/DataTable';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import AuditLog from '@/components/admin/AuditLog';
import NotificationComposer, { type NotificationPayload } from '@/components/admin/NotificationComposer';
import { useAdminData, ensureOk } from '@/components/admin/useAdminTable';
import { dateLabel, plural, shortAgo, shortUntil } from '@/components/admin/format';
import styles from '@/styles/admin.module.css';

interface Detail {
    account: UserRow;
    games: { id: string; title: string; generation?: number; img?: string; createdAt: string; saves: number }[];
    saves: { id: string; gameId: string; gameTitle?: string; title: string; filePath: string; img?: string; connected: boolean; updatedAt: string }[];
    pens: { id: string; name: string; order: number; pokemon: number }[];
    pokemon: {
        id: string; speciesIndex: number; speciesName: string; nickname: string; level: number; generation: number;
        otName: string; penName?: string; sourceGameTitle?: string; transferring: boolean; extractedAt: string;
    }[];
    notifications: { id: string; type: string; title: string; readAt?: string; expiresAt?: string; createdAt: string }[];
}

type GameRow = Detail['games'][number];
type SaveRow = Detail['saves'][number];
type PokemonRow = Detail['pokemon'][number];
type NotificationRow = Detail['notifications'][number];

/** Something about to be deleted, and what to say about it */
interface PendingDelete {
    title: string;
    message: string;
    itemName: string;
    url: string;
    done: string;
    /** Where to go once it's gone, if this page no longer applies */
    then?: string;
}

const TYPE_NAMES: Record<string, string> = { FRIEND_REQUEST: 'Friend request', SYSTEM: 'System', INFO: 'Info' };

const when = (iso: string) => <span title={dateLabel.format(new Date(iso))}>{shortAgo(iso)}</span>;

function Card({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <section className={styles.overviewCard} aria-labelledby={id}>
            <h3 id={id} className={styles.cardTitle}>{title}</h3>
            {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
            {children}
        </section>
    );
}

export default function UserDetailClient({ userId }: { userId: string }) {
    const router = useRouter();
    const { bySpecies, byDexNo, spriteStyle } = usePokemonSprites();
    const currentUser = useAuth()?.user;
    const [pending, setPending] = useState<PendingDelete | null>(null);
    const [composing, setComposing] = useState(false);

    const load = useCallback(async (): Promise<Detail | null> => {
        const res = await fetch(`/api/admin/users/${userId}`);
        if (res.status === 404) return null;
        return (await ensureOk(res, 'Failed to load this user')).json();
    }, [userId]);
    const { data: detail, loading, saving, error, setError, run } = useAdminData<Detail | null>(load, null);

    const account = detail?.account;
    const name = account ? account.username || account.email : 'User';
    const isSelf = account?.userId === currentUser?.userId;

    const runAction = (action: AccountAction) =>
        run(() => postAccountAction(userId, action), (r) => r.message, 'Account action failed');

    const confirmDelete = async () => {
        if (!pending) return;
        const { url, done, then } = pending;
        const ok = await run(
            async () => ensureOk(await fetch(url, { method: 'DELETE' }), 'Delete failed'),
            done,
            'Delete failed',
            { reload: !then },
        );
        setPending(null);
        if (ok && then) router.push(then);
    };

    // Downloading changes nothing, so there's nothing to reload
    const download = (save: SaveRow) => run(
        () => downloadSav({ filePath: save.filePath, gameId: save.gameId, title: save.title }),
        `Downloaded "${save.title}"`,
        'Download failed',
        { reload: false },
    );

    const sprite = (p: PokemonRow) =>
        // A Gen 2 species number is its National Dex number; Gen 1 has its own order
        p.generation === 2 ? byDexNo(String(p.speciesIndex).padStart(3, '0')) : bySpecies(p.speciesIndex);

    const gameColumns: Column<GameRow>[] = [
        {
            key: 'title', header: 'Game', sortValue: (g) => g.title,
            render: (g) => (
                <Flex $alignItems="center" $gap="0.75rem">
                    {g.img && <Image src={blobReadUrl(g.img)} alt="" className={styles.gameImage} width={32} height={32} unoptimized />}
                    <Text fontWeight="medium">{g.title}</Text>
                </Flex>
            ),
        },
        { key: 'generation', header: 'Gen', width: '6rem', sortValue: (g) => g.generation, render: (g) => g.generation ?? <span className={styles.muted}>—</span> },
        { key: 'saves', header: 'Saves', width: '7rem', sortValue: (g) => g.saves, render: (g) => <span className={styles.numeric}>{g.saves}</span> },
        { key: 'added', header: 'Added', width: '10rem', sortValue: (g) => g.createdAt, render: (g) => when(g.createdAt) },
        {
            key: 'actions', header: '', width: '5rem',
            render: (g) => (
                <button
                    className={`${styles.actionButton} ${styles.destructive}`}
                    title="Delete game"
                    onClick={() => setPending({
                        title: 'Delete Game',
                        message: `Delete this game${g.saves ? ` and its ${plural(g.saves, 'save')}` : ''}, with their files? Pokémon already at the Ranch stay. This can't be undone.`,
                        itemName: g.title,
                        url: `/api/games/${g.id}`,
                        done: `Deleted "${g.title}"`,
                    })}
                >
                    <FaTrash />
                </button>
            ),
        },
    ];

    const saveColumns: Column<SaveRow>[] = [
        { key: 'title', header: 'Save', sortValue: (s) => s.title, render: (s) => <Text fontWeight="medium">{s.title}</Text> },
        {
            key: 'game', header: 'Game', sortValue: (s) => s.gameTitle,
            render: (s) => s.gameTitle ?? <span className={styles.muted}>Deleted game</span>,
        },
        { key: 'updated', header: 'Saved', width: '10rem', sortValue: (s) => s.updatedAt, render: (s) => when(s.updatedAt) },
        {
            key: 'actions', header: '', width: '8rem',
            render: (s) => (
                <Flex $gap="0.5rem">
                    <button className={`${styles.actionButton} ${styles.edit}`} title="Download as .sav" disabled={!s.filePath || saving} onClick={() => download(s)}>
                        <FaDownload />
                    </button>
                    <button
                        className={`${styles.actionButton} ${styles.destructive}`}
                        title="Delete save"
                        onClick={() => setPending({
                            title: 'Delete Save',
                            message: "Delete this save and its file? This can't be undone.",
                            itemName: s.gameTitle ? `${s.title} (${s.gameTitle})` : s.title,
                            url: `/api/save-states/${s.id}`,
                            done: `Deleted "${s.title}"`,
                        })}
                    >
                        <FaTrash />
                    </button>
                </Flex>
            ),
        },
    ];

    const pokemonColumns: Column<PokemonRow>[] = [
        {
            key: 'name', header: 'Pokémon', sortValue: (p) => p.nickname || p.speciesName,
            render: (p) => (
                <Flex $alignItems="center" $gap="0.75rem">
                    <span className={styles.spriteBox}>
                        {sprite(p) && <img src={sprite(p)} alt="" style={spriteStyle} />}
                    </span>
                    <Flex $direction="column">
                        <Text fontWeight="medium">{p.nickname || p.speciesName}</Text>
                        {p.nickname && p.nickname !== p.speciesName && <Text fontSize="sm" variation="secondary">{p.speciesName}</Text>}
                    </Flex>
                </Flex>
            ),
        },
        { key: 'level', header: 'Level', width: '7rem', sortValue: (p) => p.level, render: (p) => <span className={styles.numeric}>{p.level}</span> },
        {
            key: 'pen', header: 'Pen', sortValue: (p) => p.penName,
            render: (p) => p.transferring
                ? <span className={`${styles.statusBadge} ${styles.statusBadgeWarning}`}>Moving</span>
                : p.penName ?? <span className={styles.muted}>Not settled</span>,
        },
        {
            key: 'from', header: 'From', sortValue: (p) => p.sourceGameTitle,
            render: (p) => (
                <span title={`OT ${p.otName || '—'}, Gen ${p.generation}`}>
                    {p.sourceGameTitle ?? <span className={styles.muted}>Deleted game</span>}
                </span>
            ),
        },
        { key: 'arrived', header: 'Arrived', width: '10rem', sortValue: (p) => p.extractedAt, render: (p) => when(p.extractedAt) },
    ];

    const notificationColumns: Column<NotificationRow>[] = [
        { key: 'title', header: 'Title', sortValue: (n) => n.title },
        { key: 'type', header: 'Type', width: '13rem', sortValue: (n) => n.type, render: (n) => TYPE_NAMES[n.type] ?? n.type },
        {
            key: 'read', header: 'Status', width: '9rem', sortValue: (n) => (n.readAt ? 1 : 0),
            render: (n) => (
                <span className={`${styles.statusBadge} ${n.readAt ? styles.statusBadgeActive : styles.statusBadgeInactive}`}>
                    {n.readAt ? 'Read' : 'Unread'}
                </span>
            ),
        },
        { key: 'sent', header: 'Sent', width: '10rem', sortValue: (n) => n.createdAt, render: (n) => when(n.createdAt) },
        {
            key: 'expires', header: 'Expires', width: '10rem', sortValue: (n) => n.expiresAt,
            render: (n) => n.expiresAt
                ? <span title={dateLabel.format(new Date(n.expiresAt))}>{shortUntil(n.expiresAt)}</span>
                : <span className={styles.muted}>Never</span>,
        },
    ];

    const sendNotification = async (payload: NotificationPayload) => {
        const ok = await run(
            async () => ensureOk(await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }), 'Send failed'),
            `Sent to ${name}`,
            'Failed to send notification',
        );
        if (ok) setComposing(false);
        return ok;
    };

    return (
        <AdminDashboard>
            <SidebarNavigation activeTab="users" onTabChange={(tab) => router.push(tab === 'overview' ? '/admin' : `/admin?tab=${tab}`)} />
            <AdminMain>
                <AdminHeader>
                    <Link href="/admin?tab=users" className={styles.backLink}>
                        <FaArrowLeft /> Users
                    </Link>
                    <Flex $alignItems="center" $gap="1rem" className={styles.userHeading}>
                        {account?.avatar && (
                            <Image src={blobReadUrl(account.avatar)} alt="" className={styles.avatar} width={40} height={40} unoptimized />
                        )}
                        <h2>{name}</h2>
                        {account?.admin && <span className={`${styles.statusBadge} ${styles.statusBadgeActive}`}>Admin</span>}
                        {account && !account.emailVerified && <span className={`${styles.statusBadge} ${styles.statusBadgeWarning}`}>Unverified</span>}
                        {account && isLimited(account) && <span className={`${styles.statusBadge} ${styles.statusBadgeWarning}`}>Rate limited</span>}
                    </Flex>
                </AdminHeader>
                <AdminContent>
                    <div className={styles.overview}>
                        {error && <Alert variation="error" onDismiss={() => setError(null)}>{error}</Alert>}

                        {loading ? (
                            <Text variation="secondary">Loading…</Text>
                        ) : !detail ? (
                            <Card id="missing-title" title="No such user" subtitle="They may have been deleted.">
                                <Link href="/admin?tab=users" className={styles.rowLink}>Back to Users</Link>
                            </Card>
                        ) : (
                            <>
                                <Card id="account-title" title="Account">
                                    <AccountPanel account={detail.account} saving={saving} onAction={runAction} />
                                </Card>

                                <Card id="games-title" title="Games" subtitle={plural(detail.games.length, 'game')}>
                                    <DataTable data={detail.games} columns={gameColumns} rowKey={(g) => g.id} emptyMessage="No games" compact />
                                </Card>

                                <Card id="saves-title" title="Saves" subtitle={plural(detail.saves.length, 'save')}>
                                    <DataTable data={detail.saves} columns={saveColumns} rowKey={(s) => s.id} emptyMessage="No saves" compact />
                                </Card>

                                <Card
                                    id="ranch-title"
                                    title="Ranch"
                                    subtitle={detail.pens.length
                                        ? `${plural(detail.pokemon.length, 'Pokémon', 'Pokémon')} in ${plural(detail.pens.length, 'pen')}: ${detail.pens.map((p) => `${p.name} (${p.pokemon})`).join(', ')}`
                                        : plural(detail.pokemon.length, 'Pokémon', 'Pokémon')}
                                >
                                    <DataTable data={detail.pokemon} columns={pokemonColumns} rowKey={(p) => p.id} emptyMessage="Nobody at the Ranch" compact />
                                </Card>

                                <Card id="notifications-title" title="Notifications" subtitle="Sent to them directly. Broadcasts are on the Notifications tab.">
                                    {composing ? (
                                        <NotificationComposer
                                            recipient={{ userId, label: `${name} (${detail.account.email})` }}
                                            saving={saving}
                                            onSend={sendNotification}
                                            onCancel={() => setComposing(false)}
                                        />
                                    ) : (
                                        <div className={styles.scanBar}>
                                            <button type="button" className={styles.modalCancelButton} onClick={() => setComposing(true)} disabled={saving}>
                                                Send them a notification
                                            </button>
                                        </div>
                                    )}
                                    <DataTable data={detail.notifications} columns={notificationColumns} rowKey={(n) => n.id} emptyMessage="None sent to them" compact />
                                </Card>

                                <Card id="activity-title" title="Admin activity" subtitle="What admins have done to this account and its games, saves and notifications.">
                                    {/* detail is a new object after each reload, so an action here shows up straight away */}
                                    <AuditLog userId={userId} pageSize={20} refreshKey={detail} />
                                </Card>

                                <Card id="delete-title" title="Delete account" subtitle="Removes the account, its games, saves, Ranch and notifications, with all their files. Its admin activity is kept.">
                                    <button
                                        type="button"
                                        className={styles.modalDeleteButton}
                                        disabled={isSelf || saving}
                                        title={isSelf ? "You can't delete your own account here" : undefined}
                                        onClick={() => setPending({
                                            title: 'Delete User',
                                            message: `Delete this user and everything they own: ${plural(detail.account.games, 'game')}, ${plural(detail.account.saves, 'save')}, ${plural(detail.account.pokemon, 'Ranch Pokémon', 'Ranch Pokémon')} and their files? This can't be undone.`,
                                            itemName: `${name} (${detail.account.email})`,
                                            url: `/api/admin/users/${userId}`,
                                            done: `Deleted ${name}`,
                                            then: '/admin?tab=users',
                                        })}
                                    >
                                        Delete {name}
                                    </button>
                                </Card>
                            </>
                        )}
                    </div>
                </AdminContent>
            </AdminMain>

            <ConfirmDeleteModal
                isOpen={!!pending}
                onClose={() => setPending(null)}
                onConfirm={confirmDelete}
                title={pending?.title ?? ''}
                message={pending?.message ?? ''}
                itemName={pending?.itemName}
                loading={saving}
            />
        </AdminDashboard>
    );
}
