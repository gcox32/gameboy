'use client';

import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getS3Url } from '@/utils/saveLoad';
import ProfileModal from '@/components/modals/ProfileModal';
import SettingsModal from '@/components/modals/SettingsModal';
import { signOut } from 'aws-amplify/auth';
import { useProtectedNavigation } from '@/hooks/useProtectedNavigation';
import GameInterruptModal from '@/components/modals/GameInterruptModal';
import ProfilePopout from './ProfilePopout';
import { FaCog } from 'react-icons/fa';
import styles from './styles.module.css';

const client = generateClient<Schema>();

const Nav = () => {
    const { user } = useAuth();
    const { uiSettings, updateUISettings } = useSettings();
    const [userProfile, setUserProfile] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { 
        isModalOpen, 
        handleStaticPageNavigation, 
        handleContinue, 
        handleClose 
    } = useProtectedNavigation();

    useEffect(() => {
        if (user) {
            fetchUserProfile();
        }
    }, [user]);

    const fetchUserProfile = async () => {
        if (!user) return;

        try {
            const profiles = await client.models.Profile.list({
                filter: {
                    owner: { eq: user.userId }
                }
            });
            if (profiles.data.length > 0) {
                const profile = profiles.data[0];
                setUserProfile(profile);
                if (profile.avatar) {
                    const url = await getS3Url(profile.avatar);
                    setAvatarUrl(url);
                }
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

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

    const handleSettingsUpdate = (newSettings) => {
        updateUISettings(newSettings);
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

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
                    <Link href="/play">Play</Link>
                    <Link 
                        href="/about" 
                        onClick={(e) => handleStaticPageNavigation(e, '/about')}
                    >
                        About
                    </Link>
                    <Link 
                        href="/contact" 
                        onClick={(e) => handleStaticPageNavigation(e, '/contact')}
                    >
                        Contact
                    </Link>
                    <button
                        className={styles.settingsButton}
                        onClick={handleSettingsClick}
                        aria-label="Settings"
                    >
                        <FaCog />
                    </button>
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
                settings={uiSettings}
                onSettingsChange={handleSettingsUpdate}
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