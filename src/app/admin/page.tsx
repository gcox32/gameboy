'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserManagement from '@/components/admin/UserManagement';
import GamesManagement from '@/components/admin/GamesManagement';
import NotificationsManagement from '@/components/admin/NotificationsManagement';
import SidebarNavigation from '@/components/admin/SidebarNavigation';
import {
    AdminDashboard,
    AdminMain,
    AdminHeader,
    AdminContent,
    ContentPanel
} from '@/components/admin/AdminLayout';
import styles from '@/styles/admin.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/theme';
import { GlobalStyles } from '@/theme/GlobalStyles';
import { ToastProvider } from '@/components/ui';
import Nav from '@/components/layout/Nav';

type TabType = 'users' | 'games' | 'notifications';

const tabTitles: Record<TabType, string> = {
    users: 'User Management',
    games: 'Games Management',
    notifications: 'Notifications'
};

function Admin() {
    const [activeTab, setActiveTab] = useState<TabType>('users');
    const auth = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!auth) return;
        const { user, loading } = auth;
        if (loading) return;
        if (!user) { router.push('/login'); return; }
        if (!user.admin) { router.push('/play'); }
    }, [auth, router]);

    if (!auth || auth.loading) {
        return <div className={styles.loadingContainer}>Checking admin privileges...</div>;
    }

    if (!auth.user?.admin) return null;

    return (
        <AdminDashboard>
            <SidebarNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            <AdminMain>
                <AdminHeader>
                    <h2>{tabTitles[activeTab]}</h2>
                </AdminHeader>
                <AdminContent>
                    <ContentPanel>
                        {activeTab === 'users' && <UserManagement />}
                        {activeTab === 'games' && <GamesManagement />}
                        {activeTab === 'notifications' && <NotificationsManagement />}
                    </ContentPanel>
                </AdminContent>
            </AdminMain>
        </AdminDashboard>
    );
}

export default function AdminPage() {
    return (
        <ThemeProvider theme={theme}>
            <GlobalStyles />
            <ToastProvider>
                <Nav />
                <Admin />
            </ToastProvider>
        </ThemeProvider>
    );
}
