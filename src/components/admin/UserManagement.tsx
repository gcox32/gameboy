'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaEdit, FaTrash, FaUserCog } from 'react-icons/fa';
import { blobReadUrl } from '@/utils/blobUpload';
import { Flex, Text, Alert } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import DataTable, { Column } from './DataTable';
import AdminModal from './AdminModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import SearchInput from './SearchInput';
import Pager from './Pager';
import { usePagedTable, ensureOk } from './useAdminTable';
import { dateLabel, plural, shortAgo, whole } from './format';
import { isLimited, type UserRow } from './AccountPanel';
import styles from '@/styles/admin.module.css';

const FILTERS = [
    { value: '', label: 'All accounts' },
    { value: 'admin', label: 'Admins' },
    { value: 'unverified', label: 'Unverified' },
    { value: 'limited', label: 'Rate limited' },
];

const userPage = (u: UserRow) => `/admin/users/${u.userId}`;

export default function UserManagement() {
    const table = usePagedTable<UserRow>({
        endpoint: '/api/admin/users',
        filterParam: 'filter',
        defaultSort: { key: 'joined', direction: 'desc' },
        failure: 'Failed to load users',
    });
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);
    const currentUser = useAuth()?.user;
    const isSelf = (u: UserRow) => u.userId === currentUser?.userId;

    const saveUser = async () => {
        if (!editingUser) return;
        const { userId, username, bio, admin } = editingUser;
        const ok = await table.run(
            async () => ensureOk(await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, bio, admin }),
            }), 'Update failed'),
            `Saved ${username}`,
            'Failed to update user',
        );
        if (ok) setEditingUser(null);
    };

    const deleteUser = async () => {
        if (!deletingUser) return;
        const { userId, username, email } = deletingUser;
        await table.run(
            async () => ensureOk(await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' }), 'Delete failed'),
            `Deleted ${username || email}`,
            'Failed to delete user',
        );
        setDeletingUser(null);
    };

    const columns: Column<UserRow>[] = [
        {
            key: 'username',
            header: 'Username',
            sortable: true,
            render: (u) => (
                <Flex $alignItems="center" $gap="0.75rem">
                    {u.avatar && (
                        // Unoptimized: the optimizer fetches without the cookies /api/blob/file needs
                        <Image src={blobReadUrl(u.avatar)} alt="" className={styles.avatar} width={32} height={32} unoptimized />
                    )}
                    <Link href={userPage(u)} className={styles.rowLink}>
                        {u.hasProfile ? u.username : <span className={styles.muted}>No profile</span>}
                    </Link>
                </Flex>
            ),
        },
        { key: 'email', header: 'Email', sortable: true, render: (u) => <span title={u.email}>{u.email}</span> },
        {
            key: 'status',
            header: 'Status',
            width: '13rem',
            render: (u) => (
                // Only what's worth noticing; an ordinary verified user shows a dash
                u.admin || !u.emailVerified || isLimited(u) ? (
                    <Flex $gap="0.35rem" className={styles.badgeRow}>
                        {u.admin && <span className={`${styles.statusBadge} ${styles.statusBadgeActive}`}>Admin</span>}
                        {!u.emailVerified && <span className={`${styles.statusBadge} ${styles.statusBadgeWarning}`}>Unverified</span>}
                        {isLimited(u) && <span className={`${styles.statusBadge} ${styles.statusBadgeWarning}`}>Rate limited</span>}
                    </Flex>
                ) : <Text variation="secondary" aria-label="No flags">—</Text>
            ),
        },
        {
            key: 'joined',
            header: 'Joined',
            width: '11.5rem',
            sortable: true,
            firstDirection: 'desc',
            render: (u) => <span title={dateLabel.format(new Date(u.createdAt))}>{shortAgo(u.createdAt)}</span>,
        },
        { key: 'games', header: 'Games', width: '6rem', sortable: true, firstDirection: 'desc', render: (u) => <span className={styles.numeric}>{whole.format(u.games)}</span> },
        { key: 'saves', header: 'Saves', width: '6rem', sortable: true, firstDirection: 'desc', render: (u) => <span className={styles.numeric}>{whole.format(u.saves)}</span> },
        { key: 'pokemon', header: 'Pokémon', width: '7rem', sortable: true, firstDirection: 'desc', render: (u) => <span className={styles.numeric}>{whole.format(u.pokemon)}</span> },
        {
            key: 'actions',
            header: 'Actions',
            width: '10rem',
            render: (u) => (
                <Flex $gap="0.5rem">
                    <Link href={userPage(u)} className={`${styles.actionButton} ${styles.edit}`} title="Everything they own, and account help">
                        <FaUserCog />
                    </Link>
                    <button onClick={() => setEditingUser(u)} className={`${styles.actionButton} ${styles.edit}`} title="Edit user">
                        <FaEdit />
                    </button>
                    <button
                        onClick={() => setDeletingUser(u)}
                        className={`${styles.actionButton} ${styles.destructive}`}
                        disabled={isSelf(u)}
                        title={isSelf(u) ? "You can't delete your own account here" : 'Delete user'}
                    >
                        <FaTrash />
                    </button>
                </Flex>
            ),
        },
    ];

    return (
        <div className={styles.managementContainer}>
            <div className={styles.tableToolbar}>
                <div className={styles.toolbarFilters}>
                    <SearchInput value={table.searchTerm} onChange={table.setSearchTerm} placeholder="Search accounts..." />
                    <select aria-label="Show" value={table.filter} onChange={(e) => table.setFilter(e.target.value)} className={styles.searchInput}>
                        {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                </div>
            </div>

            {table.error && <Alert variation="error" onDismiss={() => table.setError(null)}>{table.error}</Alert>}

            <DataTable
                data={table.rows}
                columns={columns}
                rowKey={(u) => u.userId}
                loading={table.loading}
                emptyMessage={table.searchTerm.trim() || table.filter ? 'No accounts match' : 'No users yet'}
                sort={table.sort}
                onSortChange={table.setSort}
            />

            <Pager
                page={table.page}
                pageSize={table.pageSize}
                total={table.total}
                noun="account"
                busy={table.fetching || table.searchPending}
                onPage={table.setPage}
            />

            <AdminModal
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                title={`Edit User: ${editingUser?.username || editingUser?.email}`}
                onSave={saveUser}
                loading={table.saving}
            >
                {editingUser && (
                    <Flex $direction="column" $gap="1rem">
                        <div className={styles.formGroup}>
                            <label htmlFor="user-username" className={styles.formLabel}>Username</label>
                            <input id="user-username" type="text" value={editingUser.username} onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })} className={styles.formInput} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="user-email" className={styles.formLabel}>Email</label>
                            <input id="user-email" type="email" value={editingUser.email} disabled className={styles.formInput} title="The login email, which the user's files are stored under" />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="user-bio" className={styles.formLabel}>Bio</label>
                            <textarea id="user-bio" value={editingUser.bio} onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })} className={styles.formInput} rows={3} />
                        </div>
                        <div className={styles.checkboxGroup}>
                            <input
                                type="checkbox"
                                id="user-admin"
                                checked={editingUser.admin}
                                disabled={isSelf(editingUser)}
                                title={isSelf(editingUser) ? "You can't remove your own admin role" : undefined}
                                onChange={(e) => setEditingUser({ ...editingUser, admin: e.target.checked })}
                                className={styles.checkbox}
                            />
                            <label htmlFor="user-admin" className={styles.formLabel}>Administrator</label>
                        </div>
                    </Flex>
                )}
            </AdminModal>

            <ConfirmDeleteModal
                isOpen={!!deletingUser}
                onClose={() => setDeletingUser(null)}
                onConfirm={deleteUser}
                title="Delete User"
                message={deletingUser
                    ? `Delete this user and everything they own: ${plural(deletingUser.games, 'game')}, ${plural(deletingUser.saves, 'save')}, ${plural(deletingUser.pokemon, 'Ranch Pokémon', 'Ranch Pokémon')} and their files? This can't be undone.`
                    : ''}
                itemName={deletingUser ? `${deletingUser.username || 'No profile'} (${deletingUser.email})` : undefined}
                loading={table.saving}
            />
        </div>
    );
}
