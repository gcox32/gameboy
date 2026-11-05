'use client';

import styles from './styles.module.css';
import { FaBell, FaCheckDouble } from 'react-icons/fa';
import { useRef, useState } from 'react';
import clsx from 'clsx';
import BaseModal from '@/components/modals/BaseModal';
import paper from '@/components/modals/paper.module.css';
import Popover, { PopoverHeader, PopoverItem } from '@/components/common/Popover';
import { NotificationModel } from '@/types';

interface NotificationsProps {
    toggleNotifications: () => void;
    isNotifOpen: boolean;
    unreadCount: number;
    markAllRead: () => void;
    notifications: NotificationModel[];
    isLoadingNotifs: boolean;
    notifNextToken: string | null;
    fetchNotifications: (nextToken: string | null) => void;
}

export default function Notifications({ toggleNotifications, isNotifOpen, unreadCount, markAllRead, notifications, isLoadingNotifs, notifNextToken, fetchNotifications }:
    NotificationsProps
) {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [activeNotification, setActiveNotification] = useState<NotificationModel | null>(null);

    const handleNotificationClick = async (n: NotificationModel) => {
        try {
            if (!n.readAt) {
                await fetch(`/api/notifications/${n.id}`, { method: 'PUT' });
                await fetchNotifications(null);
            }
        } catch (e) {
            console.error('Failed to mark notification as read', e);
        } finally {
            setActiveNotification(n);
            setIsDetailOpen(true);
        }
    };

    return (
        <div className={styles.notifWrapper} ref={wrapperRef}>
            <button
                className={styles.notifButton}
                onClick={toggleNotifications}
                aria-label="Notifications"
                aria-expanded={isNotifOpen}
            >
                <FaBell />
                <span className={styles.label}>Notifications</span>
                {unreadCount > 0 && (
                    <span className={styles.badge} aria-label="Unread notifications"></span>
                )}
            </button>
            <Popover
                isOpen={isNotifOpen}
                onClose={toggleNotifications}
                containerRef={wrapperRef}
                ariaLabel="Notifications"
                width={320}
                caretRight={12}
            >
                <PopoverHeader
                    title="Notifications"
                    action={
                        <button
                            className={clsx(styles.markReadBtn, unreadCount === 0 && styles.allRead)}
                            onClick={markAllRead}
                            disabled={unreadCount === 0}
                            aria-label={unreadCount === 0 ? "All notifications read" : "Mark all as read"}
                        >
                            <FaCheckDouble />
                        </button>
                    }
                />
                <div className={styles.notifList}>
                    {notifications.length === 0 && !isLoadingNotifs && (
                        <div className={styles.notifEmpty}>All caught up!</div>
                    )}
                    {notifications.map((n: NotificationModel) => (
                        <PopoverItem
                            key={n.id}
                            className={clsx(styles.notifItem, !n.readAt && styles.unread)}
                            onClick={() => handleNotificationClick(n)}
                        >
                            <span className={styles.notifTitle}>{n.title}</span>
                            {n.body && <span className={styles.notifBody}>{n.body}</span>}
                            {n.createdAt && <span className={styles.notifMeta}>{new Date(n.createdAt).toLocaleString()}</span>}
                        </PopoverItem>
                    ))}
                    {isLoadingNotifs && <div className={styles.notifLoading}>Loading...</div>}
                </div>
                {notifNextToken && (
                    <PopoverItem className={styles.loadMoreBtn} onClick={() => fetchNotifications(notifNextToken)}>Load more</PopoverItem>
                )}
            </Popover>
            <BaseModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                ariaLabel={activeNotification?.title ?? 'Notification'}
                className={`${paper.modalContent} ${paper.paperModal}`}
            >
                {activeNotification && (
                    <>
                        <h2 className={paper.modalTitle}>{activeNotification.title}</h2>
                        <div className={styles.detail}>
                            {activeNotification.createdAt && (
                                <div className={styles.notifMeta}>{new Date(activeNotification.createdAt).toLocaleString()}</div>
                            )}
                            {activeNotification.body && (
                                <p className={styles.detailBody}>{activeNotification.body}</p>
                            )}
                        </div>
                    </>
                )}
            </BaseModal>
        </div>
    );
}
