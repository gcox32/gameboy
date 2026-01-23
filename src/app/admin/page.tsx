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
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/theme';
import { GlobalStyles } from '@/theme/GlobalStyles';
import { ToastProvider } from '@/components/ui';
import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';

type TabType = 'users' | 'games' | 'notifications';

const tabTitles: Record<TabType, string> = {
    users: 'User Management',
    games: 'Games Management',
    notifications: 'Notifications'
};

function Admin() {
    const [activeTab, setActiveTab] = useState<TabType>('users');
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [checkingAdmin, setCheckingAdmin] = useState(true);

    const auth = useAuth();
    const router = useRouter();
    const client = generateClient<Schema>();

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (auth) {
                const { user, loading } = auth;

                if (loading) {
                    return;
                }

                if (!user) {
                    router.push('/login');
                    return;
                }

                try {
                    const profileResponse = await client.models.Profile.list({
                        filter: {
                            owner: { eq: user.userId }
                        }
                    });

                    const userProfile = profileResponse.data[0];
                    if (userProfile?.admin) {
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                        router.push('/play');
                    }
                } catch (error) {
                    console.error('Error checking admin status:', error);
                    setIsAdmin(false);
                    router.push('/play');
                } finally {
                    setCheckingAdmin(false);
                }
            }
        };

        checkAdminStatus();
    }, [auth, router, client]);

    if (checkingAdmin || !auth) {
        return (
            <div className={styles.loadingContainer}>
                Checking admin privileges...
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'users':
                return <UserManagement />;
            case 'games':
                return <GamesManagement />;
            case 'notifications':
                return <NotificationsManagement />;
            default:
                return <UserManagement />;
        }
    };

    return (
        <AdminDashboard>
            <SidebarNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />
            <AdminMain>
                <AdminHeader>
                    <h2>{tabTitles[activeTab]}</h2>
                </AdminHeader>
                <AdminContent>
                    <ContentPanel>
                        {renderContent()}
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
                <Footer />
            </ToastProvider>
        </ThemeProvider>
    );
}
