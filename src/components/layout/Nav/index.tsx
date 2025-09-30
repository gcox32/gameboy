'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getS3Url } from '@/utils/saveLoad';
import ProfileModal from '@/components/modals/ProfileModal';
import SettingsModal from '@/components/modals/SettingsModal';
import { type AuthUser, signOut } from 'aws-amplify/auth';
import { useProtectedNavigation } from '@/hooks/useProtectedNavigation';
import GameInterruptModal from '@/components/modals/utilities/GameInterruptModal';
import ProfilePopout from './ProfilePopout';
import styles from './styles.module.css';
import Notifications from './Notifications';
import Settings from './Settings';
import MobileFooter from './MobileFooter';

interface Profile {
    id: string;
    username: string;
    avatar: string;
}

const client = generateClient<Schema>();

const Nav = () => {
    const auth = useAuth();
    if (!auth) throw new Error('Auth context not available');
    
    const { user } = auth as { user: AuthUser | null };
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [notifNextToken, setNotifNextToken] = useState<string | null>(null);
    const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
    const { 
        isModalOpen,
        handleContinue, 
        handleClose 
    } = useProtectedNavigation();

    const fetchUserProfile = useCallback(async () => {
        if (!user) return;

        try {
            const profiles = await client.models.Profile.list({
                filter: {
                    owner: { eq: user.userId }
                }
            });
            if (profiles.data.length > 0) {
                const profile = profiles.data[0];
                setUserProfile(profile as Profile);
                if (profile.avatar) {
                    const url = await getS3Url(profile.avatar);
                    setAvatarUrl(url);
                }
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    }, [user]);

    const fetchNotifications = useCallback(async (nextToken?: string | null) => {
        if (!user) return;
        try {
            setIsLoadingNotifs(true);
            const resp = await client.models.Notification.list({
                filter: { 
                    or: [
                        {owner: { eq: user.userId }}, 
                        {sender: { eq: 'SYSTEM' }}
                    ]
                },
                limit: 10,
                nextToken: nextToken ?? undefined,
                sortDirection: 'DESC'
            } as any);
            const items = resp.data ?? [];
            setNotifications((prev) => nextToken ? [...prev, ...items] : items);
            setNotifNextToken((resp as any).nextToken ?? null);
            const unread = items.filter((n: any) => !n.readAt).length;
            if (!nextToken) setUnreadCount(unread);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoadingNotifs(false);
        }
    }, [user]);

    const markAllRead = useCallback(async () => {
        try {
            const toMark = notifications.filter((n: any) => !n.readAt);
            await Promise.all(toMark.map((n: any) => client.models.Notification.update({ id: n.id, readAt: new Date().toISOString() })));
            setNotifications((prev) => prev.map((n: any) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
            setUnreadCount(0);
        } catch (e) {
            console.error('Failed to mark notifications read', e);
        }
    }, [notifications]);

    const handleAvatarClick = () => {
        setShowDropdown(!showDropdown);
    };

    const handleProfileOptionClick = () => {
        openProfileModal();
        setShowDropdown(false);
    };

    const handleSettingsClick = () => {
        setIsSettingsModalOpen(true);
    };

    const handleLogout = async () => {
        try {
            await signOut();
            setShowDropdown(false);
            window.location.href = '/';

        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const openProfileModal = () => {
        setIsProfileModalOpen(true);
        setShowDropdown(false);
    };

    const closeProfileModal = () => {
        setIsProfileModalOpen(false);
    };

    const closeSettingsModal = () => {
        setIsSettingsModalOpen(false);
    }

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleNotifications = () => {
        const newOpen = !isNotifOpen;
        setIsNotifOpen(newOpen);
        if (newOpen) {
            fetchNotifications();
        }
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
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                    aria-expanded={isMenuOpen}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                <div className={`${styles.navMenu} ${isMenuOpen ? styles.open : ''}`}>
                    <Settings handleSettingsClick={handleSettingsClick} />
                    {user && (
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
                    )}
                    {user ? (
                        <ProfilePopout
                            userProfile={userProfile}
                            avatarUrl={avatarUrl}
                            onAvatarClick={handleAvatarClick}
                            onProfileClick={handleProfileOptionClick}
                            onLogoutClick={handleLogout}
                            isOpen={showDropdown}
                        />
                    ) : (
                        <Link href="login" onClick={() => setIsMenuOpen(false)}>Login</Link>
                    )}
                    <MobileFooter setIsMenuOpen={setIsMenuOpen} />
                </div>
            </nav>
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={closeProfileModal}
                userProfile={userProfile}
                onUpdate={fetchUserProfile}
            />
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={closeSettingsModal}
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