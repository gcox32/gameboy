'use client';

import styles from './styles.module.css';
import { FaBell } from 'react-icons/fa';
import { useEffect, useRef } from 'react';

interface NotificationsProps {
    toggleNotifications: () => void;
    isNotifOpen: boolean;
    unreadCount: number;
    markAllRead: () => void;
    notifications: any[];
    isLoadingNotifs: boolean;
    notifNextToken: string | null;
    fetchNotifications: (nextToken: string | null) => void;
}
export default function Notifications({ toggleNotifications, isNotifOpen, unreadCount, markAllRead, notifications, isLoadingNotifs, notifNextToken, fetchNotifications }: 
    NotificationsProps
) {
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isNotifOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (wrapperRef.current && !wrapperRef.current.contains(target)) {
                toggleNotifications();
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                toggleNotifications();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isNotifOpen, toggleNotifications]);

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
                <span className={styles.badge} aria-label={`${unreadCount} unread notifications`}>{unreadCount}</span>
            )}
        </button>
        {isNotifOpen && (
            <div className={styles.notifPopover} role="dialog" aria-label="Notifications">
                <div className={styles.notifHeader}>
                    <span>Notifications</span>
                    <button className={styles.markReadBtn} onClick={markAllRead} disabled={unreadCount === 0}>Mark all read</button>
                </div>
                <div className={styles.notifList}>
                    {notifications.length === 0 && !isLoadingNotifs && (
                        <div className={styles.notifEmpty}>All caught up!</div>
                    )}
                    {notifications.map((n: any) => (
                        <div key={n.id} className={`${styles.notifItem} ${!n.readAt ? styles.unread : ''}`}>
                            <div className={styles.notifTitle}>{n.title}</div>
                            {n.body && <div className={styles.notifBody}>{n.body}</div>}
                            {n.createdAt && <div className={styles.notifMeta}>{new Date(n.createdAt).toLocaleString()}</div>}
                        </div>
                    ))}
                    {isLoadingNotifs && <div className={styles.notifLoading}>Loading...</div>}
                </div>
                {notifNextToken && (
                    <button className={styles.loadMoreBtn} onClick={() => fetchNotifications(notifNextToken)}>Load more</button>
                )}
            </div>
        )}
    </div>
    );
}