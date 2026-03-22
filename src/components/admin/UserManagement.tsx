'use client';

import { useState, useEffect, useCallback } from 'react';
import { Flex, Text, Alert } from '@/components/ui';
import DataTable from './DataTable';
import AdminModal from './AdminModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import SearchInput from './SearchInput';
import styles from '@/styles/admin.module.css';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Image from 'next/image';
import buttons from '@/styles/buttons.module.css';

interface Profile {
    id: string;
    userId: string;
    username: string;
    email: string;
    avatar?: string;
    bio?: string;
    admin: boolean;
}

export default function UserManagement() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/profiles?all=true');
            if (!res.ok) throw new Error('Failed to load users');
            setUsers(await res.json());
        } catch (err) {
            setError('Failed to load users. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const handleSort = (key: string, direction: 'asc' | 'desc') => {
        setSortConfig({ key, direction });
    };

    const filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (!sortConfig) return 0;
        const aVal = a[sortConfig.key as keyof Profile] ?? '';
        const bVal = b[sortConfig.key as keyof Profile] ?? '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSaveUser = async () => {
        if (!editingUser) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/profiles/${editingUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: editingUser.username,
                    email: editingUser.email,
                    bio: editingUser.bio,
                    admin: editingUser.admin,
                }),
            });
            if (!res.ok) throw new Error('Update failed');
            setEditingUser(null);
            loadUsers();
        } catch (err) {
            setError('Failed to update user. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteUser = async () => {
        if (!deletingUser) return;
        try {
            setLoading(true);
            await fetch(`/api/profiles/${deletingUser.id}`, { method: 'DELETE' });
            setDeletingUser(null);
            await loadUsers();
        } catch (err) {
            setError('Failed to delete user. Please try again.');
            console.error(err);
            setLoading(false);
        }
    };

    const columns = [
        {
            key: 'username',
            header: 'Username',
            sortable: true,
            render: (user: Profile) => (
                <Flex $alignItems="center" $gap="0.75rem">
                    {user.avatar && (
                        <Image
                            src={user.avatar}
                            alt={user.username}
                            className={styles.avatar}
                            width={32}
                            height={32}
                        />
                    )}
                    <Text $fontWeight="medium">{user.username}</Text>
                </Flex>
            )
        },
        { key: 'email', header: 'Email', sortable: true },
        {
            key: 'admin',
            header: 'Role',
            sortable: true,
            render: (user: Profile) => (
                <span className={`${styles.statusBadge} ${user.admin ? styles.statusBadgeActive : styles.statusBadgeInactive}`}>
                    {user.admin ? 'Admin' : 'User'}
                </span>
            )
        },
        {
            key: 'userId',
            header: 'User ID',
            sortable: false,
            render: (user: Profile) => (
                <Text $fontSize="sm" style={{ fontFamily: 'monospace' }}>
                    {user.userId ?? ''}
                </Text>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            sortable: false,
            render: (user: Profile) => (
                <Flex $gap="0.5rem">
                    <button onClick={() => setEditingUser(user)} className={`${styles.actionButton} edit`} title="Edit user">
                        <FaEdit />
                    </button>
                    <button onClick={() => setDeletingUser(user)} className={`${styles.actionButton} destructive`} title="Delete user">
                        <FaTrash />
                    </button>
                </Flex>
            )
        }
    ];

    return (
        <div className={styles.managementContainer}>
            <Flex $justifyContent="space-between" $alignItems="center" className={styles.tableToolbar}>
                <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search users..." />
                <div className={buttons.buttonGroup} style={{ width: 'auto', alignItems: 'flex-end' }}>
                    <button className={buttons.retroButton} onClick={() => setShowCreateModal(true)}>
                        Create User
                    </button>
                </div>
            </Flex>

            {error && <Alert $variation="error" isDismissible>{error}</Alert>}

            <DataTable
                data={sortedUsers}
                columns={columns}
                loading={loading}
                emptyMessage="No users found"
                onSort={handleSort}
                currentSort={sortConfig}
            />

            <div className={styles.tableFooter}>
                <Text $fontSize="sm" $variation="secondary">Total: {users.length} users</Text>
            </div>

            <AdminModal
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                title={`Edit User: ${editingUser?.username}`}
                onSave={handleSaveUser}
                loading={loading}
            >
                {editingUser && (
                    <Flex $direction="column" $gap="1rem">
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Username</label>
                            <input type="text" value={editingUser.username} onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })} className={styles.formInput} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Email</label>
                            <input type="email" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} className={styles.formInput} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Bio</label>
                            <textarea value={editingUser.bio || ''} onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })} className={styles.formInput} rows={3} />
                        </div>
                        <div className={styles.checkboxGroup}>
                            <input type="checkbox" id="admin" checked={editingUser.admin} onChange={(e) => setEditingUser({ ...editingUser, admin: e.target.checked })} className={styles.checkbox} />
                            <label htmlFor="admin" className={styles.formLabel}>Administrator</label>
                        </div>
                    </Flex>
                )}
            </AdminModal>

            <AdminModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New User"
                onSave={() => setShowCreateModal(false)}
            >
                <Text>User creation is not yet implemented.</Text>
            </AdminModal>

            <ConfirmDeleteModal
                isOpen={!!deletingUser}
                onClose={() => setDeletingUser(null)}
                onConfirm={confirmDeleteUser}
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone."
                itemName={deletingUser?.username}
                loading={loading}
            />
        </div>
    );
}
