'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useAuth } from '@/contexts/AuthContext';
import { getS3Url } from '@/utils/saveLoad';
import ProfileModal from '@/components/modals/ProfileModal';
import SettingsModal from '@/components/modals/SettingsModal';
import { useProtectedNavigation } from '@/hooks/useProtectedNavigation';
import GameInterruptModal from '@/components/modals/utilities/GameInterruptModal';
import ProfilePopout from './ProfilePopout';
import styles from './styles.module.css';
import Notifications from './Notifications';
import Settings from './Settings';
import MobileFooter from './MobileFooter';
import Friends from './Friends';
import AdminLink from './AdminLink';
import { NotificationModel, ProfileModel } from '@/types';

const Nav = () => {
    const auth = useAuth();
    if (!auth) throw new Error('Auth context not available');

    const { user } = auth;
    const [userProfile, setUserProfile] = useState<ProfileModel | null>(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [notifications, setNotifications] = useState<NotificationModel[]>([]);
    const [notifNextToken, setNotifNextToken] = useState<string | null>(null);
    const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
    const [isFriendsOpen, setIsFriendsOpen] = useState(false);

    const { isModalOpen, handleContinue, handleClose } = useProtectedNavigation();

    const fetchUserProfile = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch('/api/profiles');
            if (!res.ok) return;
            const profile: ProfileModel = await res.json();
            setUserProfile(profile);
            if (profile.avatar) {
                const url = await getS3Url(profile.avatar);
                setAvatarUrl(url);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    }, [user]);

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
        if (user) {
            fetchUserProfile();
            fetchNotifications();
        }
    }, [user, fetchUserProfile, fetchNotifications]);

    return (
        <>
            <nav className={styles.navContainer}>
                <button
                    className={`${styles.hamburger} ${isMenuOpen ? styles.open : ''}`}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                    aria-expanded={isMenuOpen}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                <div className={`${styles.navMenu} ${isMenuOpen ? styles.open : ''}`}>
                    {user ? (
                        <>
                            {userProfile?.admin && <AdminLink />}
                            <Friends handleFriendsClick={() => setIsFriendsOpen(true)} />
                            <Settings handleSettingsClick={() => setIsSettingsModalOpen(true)} />
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
                                avatarUrl={avatarUrl}
                                onAvatarClick={() => setShowDropdown(!showDropdown)}
                                onProfileClick={() => { openProfileModal(); setShowDropdown(false); }}
                                onLogoutClick={handleLogout}
                                isOpen={showDropdown}
                            />
                        </>
                    ) : (
                        <Link href="login" onClick={() => setIsMenuOpen(false)}>Login</Link>
                    )}
                    <MobileFooter setIsMenuOpen={setIsMenuOpen} />
                </div>
            </nav>
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                userProfile={userProfile as ProfileModel}
                onUpdate={fetchUserProfile}
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
