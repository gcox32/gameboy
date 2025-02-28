'use client';

import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';

import ProfileModal from '@/components/modals/ProfileModal';
import SettingsModal from '@/components/modals/SettingsModal';
import { signOut } from 'aws-amplify/auth';
import { useProtectedNavigation } from '@/hooks/useProtectedNavigation';
import GameInterruptModal from '@/components/modals/GameInterruptModal';

const client = generateClient<Schema>();

const Nav = () => {
    const { user } = useAuth();
    const { uiSettings, updateUISettings } = useSettings();
    const [userProfile, setUserProfile] = useState(null);
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

            if (profiles.length > 0) {
                setUserProfile(profiles[0]);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    const handleProfileClick = () => {
        setShowDropdown(!showDropdown);
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

    const openSettingsModal = () => {
        setIsSettingsModalOpen(true);
        setShowDropdown(false);
    }

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
            <nav className="nav-container">
                <div className="hamburger" onClick={toggleMenu}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
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
                    {user ? (
                        <div className="profile-container">
                            <div onClick={handleProfileClick}>
                                {userProfile && userProfile.avatar ? (
                                    <Image
                                        src={userProfile.avatar}
                                        alt={userProfile.username}
                                        title={userProfile.username}
                                        width={40}
                                        height={40}
                                        className="avatar"
                                    />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {userProfile ? userProfile.username.charAt(0).toUpperCase() : ''}
                                    </div>
                                )}
                            </div>
                            {showDropdown && (
                                <div className="profile-dropdown">
                                    <button onClick={openProfileModal}>Profile</button>
                                    <button onClick={openSettingsModal}>Settings</button>
                                    <button onClick={handleLogout}>Logout</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="login" onClick={() => setIsMenuOpen(false)}>Login</Link>
                    )}
                </div>
            </nav>
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={closeProfileModal}
                userProfile={userProfile}
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