'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { blobReadUrl } from '@/utils/blobUpload';
import { Flex, Text, Alert } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import DataTable, { Column } from './DataTable';
import AdminModal from './AdminModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import SearchInput from './SearchInput';
import { useAdminTable, ensureOk } from './useAdminTable';
import styles from '@/styles/admin.module.css';

interface Profile {
    id: string;
    userId: string;
    username: string;
    email: string;
    avatar?: string;
    bio?: string;
    admin: boolean;
}

async function loadUsers(): Promise<Profile[]> {
    const res = await ensureOk(await fetch('/api/profiles?all=true'), 'Failed to load users');
    return res.json();
}

const searchText = (u: Profile) => [u.username, u.email];

export default function UserManagement() {
    const table = useAdminTable({ load: loadUsers, searchText });
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
    const currentUser = useAuth()?.user;
    const isSelf = (u: Profile) => u.userId === currentUser?.userId;

    const saveUser = async () => {
        if (!editingUser) return;
        const { id, username, bio, admin } = editingUser;
        const ok = await table.run(
            async () => ensureOk(await fetch(`/api/profiles/${id}`, {
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
        const { id, username } = deletingUser;
        await table.run(
            async () => ensureOk(await fetch(`/api/profiles/${id}`, { method: 'DELETE' }), 'Delete failed'),
            `Deleted ${username}`,
            'Failed to delete user',
        );
        setDeletingUser(null);
    };

    const columns: Column<Profile>[] = [
        {
            key: 'username',
            header: 'Username',
            sortValue: (u) => u.username,
            render: (u) => (
                <Flex $alignItems="center" $gap="0.75rem">
                    {u.avatar && (
                        // Unoptimized: the optimizer fetches without the cookies /api/blob/file needs
                        <Image src={blobReadUrl(u.avatar)} alt={u.username} className={styles.avatar} width={32} height={32} unoptimized />
                    )}
                    <Text fontWeight="medium">{u.username}</Text>
                </Flex>
            ),
        },
        { key: 'email', header: 'Email', sortValue: (u) => u.email },
        {
            key: 'admin',
            header: 'Role',
            sortValue: (u) => (u.admin ? 0 : 1),
            render: (u) => (
                <span className={`${styles.statusBadge} ${u.admin ? styles.statusBadgeActive : styles.statusBadgeInactive}`}>
                    {u.admin ? 'Admin' : 'User'}
                </span>
            ),
        },
        {
            key: 'userId',
            header: 'User ID',
            render: (u) => <Text fontSize="sm" className={styles.mono}>{u.userId}</Text>,
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (u) => (
                <Flex $gap="0.5rem">
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
                <SearchInput value={table.searchTerm} onChange={table.setSearchTerm} placeholder="Search users..." />
            </div>

            {table.error && <Alert variation="error" onDismiss={() => table.setError(null)}>{table.error}</Alert>}

            <DataTable data={table.rows} columns={columns} rowKey={(u) => u.id} loading={table.loading} emptyMessage="No users found" />

            <div className={styles.tableFooter}>
                <Text fontSize="sm" variation="secondary">Total: {table.items.length} users</Text>
            </div>

            <AdminModal
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                title={`Edit User: ${editingUser?.username}`}
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
                            <textarea id="user-bio" value={editingUser.bio || ''} onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })} className={styles.formInput} rows={3} />
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
                message="Delete this user and everything they own: games, saves, Ranch Pokémon and files? This can't be undone."
                itemName={deletingUser?.username}
                loading={table.saving}
            />
        </div>
    );
}
