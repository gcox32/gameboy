'use client';

import styles from './styles.module.css';
import { FaBell, FaCheckDouble } from 'react-icons/fa';
import { useEffect, useRef, useState } from 'react';
import BaseModal from '@/components/modals/BaseModal';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';
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

const client = generateClient<Schema>();

export default function Notifications({ toggleNotifications, isNotifOpen, unreadCount, markAllRead, notifications, isLoadingNotifs, notifNextToken, fetchNotifications }: 
    NotificationsProps
) {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [activeNotification, setActiveNotification] = useState<NotificationModel | null>(null);

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

    const handleNotificationClick = async (n: NotificationModel) => {
        try {
            if (!n.readAt) {
                await client.models.Notification.update({ id: n.id, readAt: new Date().toISOString() });
                // Refresh list and counts
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
        {isNotifOpen && (
            <div className={styles.notifPopover} role="dialog" aria-label="Notifications">
                <div className={styles.notifHeader}>
                    <span>Notifications</span>
                    <button 
                        className={`${styles.markReadBtn} ${unreadCount === 0 ? styles.allRead : ''}`} 
                        onClick={markAllRead} 
                        disabled={unreadCount === 0}
                        aria-label={unreadCount === 0 ? "All notifications read" : "Mark all as read"}
                    >
                        <FaCheckDouble />
                    </button>
                </div>
                <div className={styles.notifList}>
                    {notifications.length === 0 && !isLoadingNotifs && (
                        <div className={styles.notifEmpty}>All caught up!</div>
                    )}
                    {notifications.map((n: NotificationModel) => (
                        <div
                            key={n.id}
                            className={`${styles.notifItem} ${!n.readAt ? styles.unread : ''}`}
                            onClick={() => handleNotificationClick(n)}
                            role="button"
                            tabIndex={0}
                        >
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
        <BaseModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)}>
            {activeNotification && (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ marginTop: 0 }}>{activeNotification.title}</h3>
                    {activeNotification.createdAt && (
                        <div className={styles.notifMeta}>{new Date(activeNotification.createdAt).toLocaleString()}</div>
                    )}
                    {activeNotification.body && (
                        <p style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{activeNotification.body}</p>
                    )}
                    {activeNotification.type === 'REQUEST' && (
                        <div className="modalOptionsButtons">
                            <button onClick={() => setIsDetailOpen(false)}>Accept</button>
                            <button onClick={() => setIsDetailOpen(false)}>Deny</button>
                        </div>
                    )}
                </div>
            )}
        </BaseModal>
    </div>
    );
}