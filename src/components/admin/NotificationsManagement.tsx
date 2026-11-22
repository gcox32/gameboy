'use client';

import { useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { Button, Flex, Text, Alert } from '@/components/ui';
import buttons from '@/styles/buttons.module.css';
import DataTable, { Column } from './DataTable';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import SearchInput from './SearchInput';
import { useAdminTable, ensureOk, fetchUsernames } from './useAdminTable';
import styles from '@/styles/admin.module.css';

interface Notification {
    id: string;
    userId: string;
    sender: string;
    type: string;
    title: string;
    body: string;
    readAt?: string;
    /** Broadcasts only: how many users have read it */
    readCount?: number;
    createdAt?: string;
}

type NotificationRow = Notification & { recipientName: string; senderName: string };

const isBroadcast = (n: Notification) => n.userId === 'BROADCAST';
const shortId = (id?: string) => (id ? `${id.substring(0, 8)}…` : '');

async function loadNotifications(): Promise<NotificationRow[]> {
    const [res, names] = await Promise.all([
        fetch('/api/notifications?all=true').then((r) => ensureOk(r, 'Failed to load notifications')),
        fetchUsernames(),
    ]);
    const data: Notification[] = await res.json();
    return data.map((n) => ({
        ...n,
        recipientName: isBroadcast(n) ? 'All Users' : names[n.userId] ?? shortId(n.userId),
        senderName: names[n.sender] ?? n.sender,
    }));
}

const searchText = (n: NotificationRow) => [n.title, n.body, n.type, n.recipientName, n.senderName];

const typeBadge: Record<string, string | undefined> = {
    SYSTEM: styles.statusBadgeActive,
    FRIEND_REQUEST: styles.statusBadgeInfo,
};

const EMPTY_DRAFT = { title: '', body: '' };

export default function NotificationsManagement() {
    const table = useAdminTable({ load: loadNotifications, searchText });
    const [deleting, setDeleting] = useState<NotificationRow | null>(null);
    const [showQuick, setShowQuick] = useState(false);
    const [draft, setDraft] = useState(EMPTY_DRAFT);
    const canSend = !!draft.title.trim() && !!draft.body.trim();

    const sendBroadcast = async () => {
        if (!canSend) return;
        const ok = await table.run(
            async () => ensureOk(await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'BROADCAST', sender: 'SYSTEM', type: 'SYSTEM', title: draft.title.trim(), body: draft.body.trim() }),
            }), 'Send failed'),
            'Sent to all users',
            'Failed to send notification',
        );
        if (ok) {
            setDraft(EMPTY_DRAFT);
            setShowQuick(false);
        }
    };

    const deleteNotification = async () => {
        if (!deleting) return;
        const { id } = deleting;
        await table.run(
            async () => ensureOk(await fetch(`/api/notifications/${id}`, { method: 'DELETE' }), 'Delete failed'),
            'Deleted notification',
            'Failed to delete notification',
        );
        setDeleting(null);
    };

    const columns: Column<NotificationRow>[] = [
        {
            key: 'title',
            header: 'Title',
            sortValue: (n) => n.title,
            render: (n) => (
                <Flex $direction="column">
                    <Text fontWeight="medium">{n.title}</Text>
                    <span className={`${styles.statusBadge} ${typeBadge[n.type] ?? styles.statusBadgeInactive}`}>{n.type}</span>
                </Flex>
            ),
        },
        {
            key: 'body',
            header: 'Message',
            render: (n) => <Text fontSize="sm">{n.body}</Text>,
        },
        {
            key: 'recipient',
            header: 'Recipient',
            sortValue: (n) => n.recipientName,
            render: (n) => <Text fontSize="sm" className={styles.mono}>{n.recipientName}</Text>,
        },
        {
            key: 'sender',
            header: 'Sender',
            sortValue: (n) => n.senderName,
            render: (n) => <Text fontSize="sm" className={styles.mono}>{n.senderName}</Text>,
        },
        {
            key: 'status',
            header: 'Status',
            // Broadcasts by how many have read them, after direct ones (read before unread)
            sortValue: (n) => (isBroadcast(n) ? 2 + (n.readCount ?? 0) : n.readAt ? 1 : 0),
            render: (n) => isBroadcast(n) ? (
                <span className={`${styles.statusBadge} ${styles.statusBadgeInfo}`}>Read by {n.readCount ?? 0}</span>
            ) : (
                <span className={`${styles.statusBadge} ${n.readAt ? styles.statusBadgeActive : styles.statusBadgeInactive}`}>
                    {n.readAt ? 'Read' : 'Unread'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (n) => (
                <button onClick={() => setDeleting(n)} className={`${styles.actionButton} ${styles.destructive}`} title="Delete">
                    <FaTrash />
                </button>
            ),
        },
    ];

    return (
        <div className={styles.managementContainer}>
            <div className={styles.tableToolbar}>
                <SearchInput value={table.searchTerm} onChange={table.setSearchTerm} placeholder="Search notifications..." />
                <button className={buttons.retroButton} onClick={() => setShowQuick(true)} disabled={showQuick}>
                    Quick Notification
                </button>
            </div>

            {showQuick && (
                <div className={styles.quickNotification}>
                    <h3>Create App Notification</h3>
                    <Text fontSize="sm" variation="light" className={styles.quickHint}>Send a notification to all users</Text>
                    <div className={styles.quickForm}>
                        <div className={styles.formGroup}>
                            <input
                                type="text"
                                aria-label="Notification title"
                                placeholder="Notification title..."
                                value={draft.title}
                                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                                className={`${styles.formInput} ${styles.quickInput}`}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <textarea
                                aria-label="Notification message"
                                placeholder="Notification message..."
                                value={draft.body}
                                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                                className={`${styles.formInput} ${styles.quickInput}`}
                                rows={2}
                            />
                        </div>
                        <Flex $gap="0.5rem" className={styles.formActions}>
                            <Button variation="secondary" size="small" onClick={() => setShowQuick(false)} className={styles.cancelButton}>Cancel</Button>
                            <Button variation="primary" size="small" onClick={sendBroadcast} disabled={!canSend || table.saving} className={styles.sendButton}>
                                {table.saving ? 'Sending...' : 'Send to All'}
                            </Button>
                        </Flex>
                    </div>
                </div>
            )}

            {table.error && <Alert variation="error" onDismiss={() => table.setError(null)}>{table.error}</Alert>}

            <DataTable data={table.rows} columns={columns} rowKey={(n) => n.id} loading={table.loading} emptyMessage="No notifications found" />

            <div className={styles.tableFooter}>
                <Text fontSize="sm" variation="secondary">Total: {table.items.length} notifications</Text>
                <Text fontSize="sm" variation="secondary">
                    Unread (direct): {table.items.filter((n) => !isBroadcast(n) && !n.readAt).length}
                </Text>
            </div>

            <ConfirmDeleteModal
                isOpen={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={deleteNotification}
                title="Delete Notification"
                message={deleting && isBroadcast(deleting)
                    ? 'Delete this broadcast? It disappears for every user.'
                    : 'Are you sure you want to delete this notification?'}
                itemName={deleting?.title}
                loading={table.saving}
            />
        </div>
    );
}
