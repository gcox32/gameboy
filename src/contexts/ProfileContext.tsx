'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileModel } from '@/types';

interface ProfileContextValue {
    profile: ProfileModel | null;
    refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
    const userId = useAuth()?.user?.userId;
    const [profile, setProfile] = useState<ProfileModel | null>(null);

    const refreshProfile = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await fetch('/api/profiles');
            if (!res.ok) return;
            setProfile(await res.json());
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            refreshProfile();
        } else {
            setProfile(null);
        }
    }, [userId, refreshProfile]);

    return (
        <ProfileContext.Provider value={{ profile, refreshProfile }}>
            {children}
        </ProfileContext.Provider>
    );
}

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (!context) throw new Error('useProfile must be used within a ProfileProvider');
    return context;
};
