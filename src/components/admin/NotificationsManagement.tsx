'use client';

import { useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { Flex, Text, Alert } from '@/components/ui';
import buttons from '@/styles/buttons.module.css';
import DataTable, { Column } from './DataTable';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import SearchInput from './SearchInput';
import NotificationComposer, { type NotificationPayload } from './NotificationComposer';
import { dateLabel, shortUntil } from './format';
import { useAdminTable, ensureOk } from './useAdminTable';
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
    expiresAt?: string;
    createdAt?: string;
}

type NotificationRow = Notification & { recipientName: string; senderName: string };

const isBroadcast = (n: Notification) => n.userId === 'BROADCAST';
const shortId = (id?: string) => (id ? `${id.substring(0, 8)}…` : '');

async function loadNotifications(): Promise<NotificationRow[]> {
    const res = await ensureOk(await fetch('/api/notifications?all=true'), 'Failed to load notifications');
    // Names come with each notification; an account since deleted has none
    const data: (Notification & { recipientName?: string; senderName?: string })[] = await res.json();
    return data.map((n) => ({
        ...n,
        recipientName: isBroadcast(n) ? 'All Users' : n.recipientName ?? shortId(n.userId),
        senderName: n.senderName ?? n.sender,
    }));
}

const searchText = (n: NotificationRow) => [n.title, n.body, n.type, n.recipientName, n.senderName];

const typeBadge: Record<string, string | undefined> = {
    SYSTEM: styles.statusBadgeActive,
    FRIEND_REQUEST: styles.statusBadgeInfo,
};

export default function NotificationsManagement() {
    const table = useAdminTable({ load: loadNotifications, searchText });
    const [deleting, setDeleting] = useState<NotificationRow | null>(null);
    const [composing, setComposing] = useState(false);

    const send = async (payload: NotificationPayload) => {
        const ok = await table.run(
            async () => ensureOk(await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }), 'Send failed'),
            payload.userId === 'BROADCAST' ? 'Sent to everyone' : 'Sent',
            'Failed to send notification',
        );
        if (ok) setComposing(false);
        return ok;
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
            key: 'expires',
            header: 'Expires',
            width: '10rem',
            sortValue: (n) => n.expiresAt,
            render: (n) => n.expiresAt
                ? <span title={dateLabel.format(new Date(n.expiresAt))}>{shortUntil(n.expiresAt)}</span>
                : <span className={styles.muted}>Never</span>,
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
                <button className={buttons.retroButton} onClick={() => setComposing(true)} disabled={composing}>
                    New Notification
                </button>
            </div>

            {composing && (
                <NotificationComposer saving={table.saving} onSend={send} onCancel={() => setComposing(false)} />
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
