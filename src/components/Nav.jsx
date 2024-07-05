'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { generateClient } from 'aws-amplify/api';
import { listUserProfiles } from '@/graphql/queries';

const client = generateClient();

const Nav = () => {
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        if (user) {
            fetchUserProfile();
        }
    }, [user]);

    const fetchUserProfile = async () => {
        if (!user) return;

        try {
            const response = await client.graphql({
                query: listUserProfiles,
                variables: {
                    filter: {
                        owner: { eq: user.userId }
                    }
                }
            });
            
            const profiles = response.data.listUserProfiles.items;
            if (profiles.length > 0) {
                setUserProfile(profiles[0]);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    return (
        <nav className="nav-container">
            <div className="nav-left">
                <Link href="/play">Play</Link>
                <Link href="/about">About</Link>
                <Link href="/contact">Contact</Link>
            </div>
            <div className="nav-right">
                {user ? (
                    <div className="profile-container">
                        <Link href="/profile">
                            {userProfile && userProfile.avatar ? (
                                <Image
                                    src={userProfile.avatar}
                                    alt="Profile"
                                    title="Profile"
                                    width={40}
                                    height={40}
                                    className="avatar"
                                />
                            ) : (
                                <div className="avatar-placeholder">
                                    {userProfile ? userProfile.username.charAt(0).toUpperCase() : ''}
                                </div>
                            )}
                        </Link>
                    </div>
                ) : (
                    <Link href="/auth/login">Login</Link>
                )}
            </div>
        </nav>
    );
};

export default Nav;