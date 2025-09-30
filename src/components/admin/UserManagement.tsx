'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Button,
    Flex,
    Text,
    Alert,
    Heading
} from '@/components/ui';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';
import DataTable from './DataTable';
import AdminModal from './AdminModal';
import SearchInput from './SearchInput';
import styles from '@/app/admin/styles.module.css';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Image from 'next/image';
import { getUrl } from 'aws-amplify/storage';

interface Profile {
    id: string;
    owner: string;
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
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [avatarUrlsByUserId, setAvatarUrlsByUserId] = useState<Record<string, string>>({});

    const client = generateClient<Schema>();

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await client.models.Profile.list();
            setUsers(response.data as unknown as Profile[]);
        } catch (err) {
            setError('Failed to load users. Please try again.');
            console.error('Error loading users:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Resolve presigned URLs for any user avatars stored in S3
    useEffect(() => {
        let isMounted = true;
        const resolveAvatarUrls = async () => {
            const nextMap: Record<string, string> = {};
            const tasks = users.map(async (user) => {
                if (!user.avatar) return;
                if (user.avatar.slice(0, 4) === 'http') {
                    nextMap[user.id] = user.avatar;
                    return;
                }
                try {
                    const { url } = await getUrl({ path: user.avatar });
                    nextMap[user.id] = String(url);
                } catch (e) {
                    // ignore individual failures
                }
            });
            await Promise.all(tasks);
            if (isMounted) {
                setAvatarUrlsByUserId(nextMap);
            }
        };

        if (users.length > 0) {
            resolveAvatarUrls();
        } else {
            setAvatarUrlsByUserId({});
        }

        return () => { isMounted = false; };
    }, [users]);

    const handleSort = (key: string, direction: 'asc' | 'desc') => {
        setSortConfig({ key, direction });
    };

    const filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (!sortConfig) return 0;

        const aValue = a[sortConfig.key as keyof Profile];
        const bValue = b[sortConfig.key as keyof Profile];

        if (aValue && bValue && aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue && bValue && aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const handleEditUser = (user: Profile) => {
        setEditingUser(user);
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;

        try {
            setLoading(true);
            await client.models.Profile.update({
                id: editingUser.id,
                username: editingUser.username,
                email: editingUser.email,
                bio: editingUser.bio,
                admin: editingUser.admin,
            });

            setEditingUser(null);
            loadUsers();
        } catch (err) {
            setError('Failed to update user. Please try again.');
            console.error('Error updating user:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            await client.models.Profile.delete({ id: userId });
            loadUsers();
        } catch (err) {
            setError('Failed to delete user. Please try again.');
            console.error('Error deleting user:', err);
        } finally {
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
                    {user.avatar && (user.avatar.slice(0, 4) === 'http' || avatarUrlsByUserId[user.id]) && (
                        <Image
                            src={user.avatar.slice(0, 4) === 'http' ? user.avatar : avatarUrlsByUserId[user.id]}
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
        {
            key: 'email',
            header: 'Email',
            sortable: true,
        },
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
            key: 'owner',
            header: 'User ID',
            sortable: false,
            render: (user: Profile) => (
                <Text $fontSize="sm" style={{ fontFamily: 'monospace' }}>
                    {user.owner.substring(0, 8)}...
                </Text>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            sortable: false,
            render: (user: Profile) => (
                <Flex $gap="0.5rem">
                    <button
                        onClick={() => handleEditUser(user)}
                        className={`${styles.actionButton} edit`}
                        title="Edit user"
                    >
                        <FaEdit />
                    </button>
                    <button
                        onClick={() => handleDeleteUser(user.id)}
                        className={`${styles.actionButton} destructive`}
                        title="Delete user"
                    >
                        <FaTrash />
                    </button>
                </Flex>
            )
        }
    ];

    return (
        <div className={styles.userManagement}>
            <Flex $justifyContent="space-between" $alignItems="center" className={styles.adminHeader}>
                <Heading as="h2">User Management</Heading>
                <Flex $gap="1rem" $alignItems="center" className={styles.adminActions}>
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search users..."
                    />
                    <Button
                        $variation="primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        Create User
                    </Button>
                </Flex>
            </Flex>

            {error && (
                <Alert $variation="error" isDismissible>
                    {error}
                </Alert>
            )}

            <DataTable
                data={sortedUsers}
                columns={columns}
                loading={loading}
                emptyMessage="No users found"
                onSort={handleSort}
                currentSort={sortConfig}
            />

            {/* Edit User Modal */}
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
                            <input
                                type="text"
                                value={editingUser.username}
                                onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                                className={styles.formInput}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Email</label>
                            <input
                                type="email"
                                value={editingUser.email}
                                onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                                className={styles.formInput}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Bio</label>
                            <textarea
                                value={editingUser.bio || ''}
                                onChange={(e) => setEditingUser({...editingUser, bio: e.target.value})}
                                className={styles.formInput}
                                rows={3}
                            />
                        </div>

                        <div className={styles.checkboxGroup}>
                            <input
                                type="checkbox"
                                id="admin"
                                checked={editingUser.admin}
                                onChange={(e) => setEditingUser({...editingUser, admin: e.target.checked})}
                                className={styles.checkbox}
                            />
                            <label htmlFor="admin" className={styles.formLabel}>
                                Administrator
                            </label>
                        </div>
                    </Flex>
                )}
            </AdminModal>

            {/* Create User Modal */}
            <AdminModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New User"
                onSave={() => {
                    // TODO: Implement user creation
                    setShowCreateModal(false);
                }}
            >
                <Text>User creation is not yet implemented in the backend.</Text>
            </AdminModal>
        </div>
    );
}
