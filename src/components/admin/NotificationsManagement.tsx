'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Button,
    Flex,
    Text,
    Alert
} from '@/components/ui';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';
import { getUsernamesForSubs } from '@/utils/usernames';
import DataTable from './DataTable';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import SearchInput from './SearchInput';
import styles from '@/styles/admin.module.css';
import { FaTrash } from 'react-icons/fa';
import buttons from '@/styles/buttons.module.css';

interface Notification {
    id: string;
    owner: string;
    sender: string;
    type: string;
    title: string;
    body: string;
    readAt?: string;
    createdAt?: string;
}

const client = generateClient<Schema>();

export default function NotificationsManagement() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
    const [deletingNotification, setDeletingNotification] = useState<Notification | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showQuickNotification, setShowQuickNotification] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [usernameBySub, setUsernameBySub] = useState<Record<string, string>>({});
    const [quickNotificationData, setQuickNotificationData] = useState({
        title: '',
        body: '',
        type: 'SYSTEM',
        owner: '*'
    });


    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await client.models.Notification.list();
            const data = response.data as unknown as Notification[];
            setNotifications(data);

            // Load usernames for owners
            const owners = data.map((n) => n.owner).filter(Boolean);
            if (owners.length > 0) {
                const mapping = await getUsernamesForSubs(owners);
                setUsernameBySub((prev) => ({ ...prev, ...mapping }));
            }
        } catch (err) {
            setError('Failed to load notifications. Please try again.');
            console.error('Error loading notifications:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const handleSort = (key: string, direction: 'asc' | 'desc') => {
        setSortConfig({ key, direction });
    };

    const filteredNotifications = notifications.filter(notification =>
        notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedNotifications = [...filteredNotifications].sort((a, b) => {
        if (!sortConfig) return 0;

        const aValue = a[sortConfig.key as keyof Notification];
        const bValue = b[sortConfig.key as keyof Notification];

        if (aValue && bValue && aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue && bValue && aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const handleCreateNotification = async () => {
        if (!quickNotificationData.title.trim() || !quickNotificationData.body.trim()) {
            setError('Please fill in both title and body');
            return;
        }

        try {
            setLoading(true);

            const resp = await client.models.Notification.create({
                sender: 'SYSTEM',
                type: quickNotificationData.type,
                title: quickNotificationData.title,
                body: quickNotificationData.body,
            });
            console.log(resp);

            setQuickNotificationData({ title: '', body: '', type: 'SYSTEM', owner: '*' });
            setShowQuickNotification(false);
            loadNotifications();
        } catch (err) {
            setError('Failed to create notification. Please try again.');
            console.error('Error creating notification:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteNotification = (notification: Notification) => {
        setDeletingNotification(notification);
    };

    const confirmDeleteNotification = async () => {
        if (!deletingNotification) return;

        try {
            setLoading(true);
            await client.models.Notification.delete({ id: deletingNotification.id });
            setDeletingNotification(null);
            await loadNotifications();
        } catch (err) {
            setError('Failed to delete notification. Please try again.');
            console.error('Error deleting notification:', err);
            setLoading(false);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type.toUpperCase()) {
            case 'SYSTEM':
                return styles.statusBadgeActive;
            case 'FRIEND_REQUEST':
                return styles.statusBadgeInfo;
            default:
                return styles.statusBadgeInactive;
        }
    };

    const columns = [
        {
            key: 'title',
            header: 'Title',
            sortable: true,
            render: (notification: Notification) => (
                <Flex $direction="column">
                    <Text $fontWeight="medium">{notification.title}</Text>
                    <Text $fontSize="sm" $variation="secondary">
                        {notification.type}
                    </Text>
                </Flex>
            )
        },
        {
            key: 'body',
            header: 'Message',
            sortable: false,
            render: (notification: Notification) => (
                <Text $fontSize="sm">
                    {notification.body?.length > 100
                        ? `${notification.body.substring(0, 100)}...`
                        : notification.body
                    }
                </Text>
            )
        },
        {
            key: 'owner',
            header: 'Owner',
            sortable: true,
            render: (notification: Notification) => {
                const sub = notification.owner;
                const username = usernameBySub[sub];
                return (
                    <Text $fontSize="sm" style={{ fontFamily: 'monospace' }}>
                        {username || `${sub?.substring(0, 8) ?? ''}...`}
                    </Text>
                );
            }
        },
        {
            key: 'sender',
            header: 'Sender',
            sortable: true,
            render: (notification: Notification) => {
                const sub = notification.sender;
                const username = usernameBySub[sub];
                return (
                    <Text $fontSize="sm" style={{ fontFamily: 'monospace' }}>
                        {username || sub}
                    </Text>
                );
            }
        },
        {
            key: 'readAt',
            header: 'Status',
            sortable: true,
            render: (notification: Notification) => (
                <span className={`${styles.statusBadge} ${notification.readAt ? styles.statusBadgeActive : styles.statusBadgeInactive}`}>
                    {notification.readAt ? 'Read' : 'Unread'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            sortable: false,
            render: (notification: Notification) => (
                <Flex $gap="0.5rem">
                    <button
                        onClick={() => handleDeleteNotification(notification)}
                        className={`${styles.actionButton} destructive`}
                        title="Delete notification"
                    >
                        <FaTrash />
                    </button>
                </Flex>
            )
        }
    ];

    return (
        <div className={styles.managementContainer}>
            <Flex $justifyContent="space-between" $alignItems="center" className={styles.tableToolbar}>
                <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search notifications..."
                />
                <div className={buttons.buttonGroup} style={{ width: 'auto', alignItems: 'flex-end' }}>
                    <button
                        className={buttons.primaryButton}
                        onClick={() => setShowQuickNotification(true)}
                    >
                        Quick Notification
                    </button>
                </div>
            </Flex>

            {showQuickNotification && (
                <div className={styles.quickNotification}>
                    <h3>Create App Notification</h3>
                    <Text $fontSize="sm" $variation="light" style={{ opacity: 0.9, marginBottom: '1rem' }}>
                        Send a notification to all users with minimal clicks
                    </Text>

                    <div className={styles.quickForm}>
                        <div className={styles.formGroup}>
                            <input
                                type="text"
                                placeholder="Notification title..."
                                value={quickNotificationData.title}
                                onChange={(e) => setQuickNotificationData({
                                    ...quickNotificationData,
                                    title: e.target.value
                                })}
                                className={styles.formInput}
                                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <textarea
                                placeholder="Notification message..."
                                value={quickNotificationData.body}
                                onChange={(e) => setQuickNotificationData({
                                    ...quickNotificationData,
                                    body: e.target.value
                                })}
                                className={styles.formInput}
                                rows={2}
                                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                            />
                        </div>

                        <Flex $gap="0.5rem" className={styles.formActions}>
                            <Button
                                $variation="secondary"
                                size="small"
                                onClick={() => setShowQuickNotification(false)}
                                className={styles.cancelButton}
                            >
                                Cancel
                            </Button>
                            <Button
                                $variation="primary"
                                size="small"
                                onClick={handleCreateNotification}
                                $isDisabled={loading}
                                className={styles.sendButton}
                            >
                                {loading ? 'Sending...' : 'Send to All'}
                            </Button>
                        </Flex>
                    </div>
                </div>
            )}

            {error && (
                <Alert $variation="error" isDismissible>
                    {error}
                </Alert>
            )}

            <DataTable
                data={sortedNotifications}
                columns={columns}
                loading={loading}
                emptyMessage="No notifications found"
                onSort={handleSort}
                currentSort={sortConfig}
            />

            <div className={styles.tableFooter}>
                <Text $fontSize="sm" $variation="secondary">
                    Total: {notifications.length} notifications
                </Text>
                <Text $fontSize="sm" $variation="secondary">
                    Unread: {notifications.filter(n => !n.readAt).length}
                </Text>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                isOpen={!!deletingNotification}
                onClose={() => setDeletingNotification(null)}
                onConfirm={confirmDeleteNotification}
                title="Delete Notification"
                message="Are you sure you want to delete this notification?"
                itemName={deletingNotification?.title}
                loading={loading}
            />
        </div>
    );
}
