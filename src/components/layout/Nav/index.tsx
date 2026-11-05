'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import clsx from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import ProfileModal from '@/components/modals/ProfileModal';
import SettingsModal from '@/components/modals/SettingsModal';
import { useProtectedNavigation } from '@/hooks/useProtectedNavigation';
import GameInterruptModal from '@/components/modals/utilities/GameInterruptModal';
import ProfilePopout from './ProfilePopout';
import styles from './styles.module.css';
import Notifications from './Notifications';
import { NotificationModel } from '@/types';

const NAV_LINKS = [
    { href: '/play', label: 'Play' },
    { href: '/lab', label: 'Lab' },
    { href: '/ranch', label: 'Ranch' },
];

const Nav = () => {
    const pathname = usePathname();
    const router = useRouter();
    const auth = useAuth();
    if (!auth) throw new Error('Auth context not available');

    const { user } = auth;
    const { profile: userProfile } = useProfile();
    const [showDropdown, setShowDropdown] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [notifications, setNotifications] = useState<NotificationModel[]>([]);
    const [notifNextToken, setNotifNextToken] = useState<string | null>(null);
    const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

    const { isModalOpen, guardAction, handleStaticPageNavigation, handleContinue, handleClose } = useProtectedNavigation();

    const fetchNotifications = useCallback(async (nextToken?: string | null) => {
        if (!user) return;
        try {
            setIsLoadingNotifs(true);
            const url = nextToken
                ? `/api/notifications?cursor=${encodeURIComponent(nextToken)}`
                : '/api/notifications';
            const res = await fetch(url);
            if (!res.ok) return;
            const items: NotificationModel[] = await res.json();
            setNotifications((prev) => nextToken ? [...prev, ...items] : items);
            // The API doesn't support cursor pagination yet — clear nextToken
            setNotifNextToken(null);
            if (!nextToken) setUnreadCount(items.filter((n) => !n.readAt).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoadingNotifs(false);
        }
    }, [user]);

    const markAllRead = useCallback(async () => {
        try {
            const toMark = notifications.filter((n: NotificationModel) => !n.readAt);
            await Promise.all(toMark.map((n: NotificationModel) =>
                fetch(`/api/notifications/${n.id}`, { method: 'PUT' })
            ));
            setNotifications((prev) => prev.map((n: NotificationModel) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
            setUnreadCount(0);
        } catch (e) {
            console.error('Failed to mark notifications read', e);
        }
    }, [notifications]);

    const handleLogout = async () => {
        try {
            await signOut({ callbackUrl: '/' });
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const openProfileModal = () => {
        setIsProfileModalOpen(true);
        setShowDropdown(false);
    };

    const toggleNotifications = () => {
        const newOpen = !isNotifOpen;
        setIsNotifOpen(newOpen);
        if (newOpen) fetchNotifications();
    };

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user, fetchNotifications]);

    return (
        <>
            <nav className={styles.navContainer}>
                <div className={styles.primary}>
                    {user && NAV_LINKS.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className={clsx(styles.link, pathname === href && styles.active)}
                            aria-current={pathname === href ? 'page' : undefined}
                            onClick={(e) => handleStaticPageNavigation(e, href)}
                        >
                            {label}
                        </Link>
                    ))}
                </div>
                <div className={styles.actions}>
                    {user ? (
                        <>
                            <Notifications
                                toggleNotifications={toggleNotifications}
                                isNotifOpen={isNotifOpen}
                                unreadCount={unreadCount}
                                markAllRead={markAllRead}
                                notifications={notifications}
                                isLoadingNotifs={isLoadingNotifs}
                                notifNextToken={notifNextToken}
                                fetchNotifications={fetchNotifications}
                            />
                            <ProfilePopout
                                userProfile={userProfile}
                                avatarUrl={userProfile?.avatar || null}
                                onAvatarClick={() => setShowDropdown(!showDropdown)}
                                onProfileClick={() => { openProfileModal(); setShowDropdown(false); }}
                                onSettingsClick={() => { setIsSettingsModalOpen(true); setShowDropdown(false); }}
                                onAdminClick={userProfile?.admin
                                    ? () => { setShowDropdown(false); guardAction(() => router.push('/admin')); }
                                    : undefined}
                                onLogoutClick={() => { setShowDropdown(false); guardAction(handleLogout); }}
                                isOpen={showDropdown}
                                onClose={() => setShowDropdown(false)}
                            />
                        </>
                    ) : (
                        <Link href="/login" className={styles.link}>Login</Link>
                    )}
                </div>
            </nav>
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />
            <GameInterruptModal
                isOpen={isModalOpen}
                onClose={handleClose}
                onContinue={handleContinue}
            />
        </>
    );
};

export default Nav;
