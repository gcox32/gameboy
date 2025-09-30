'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Heading,
    Flex,
    Button,
    Card,
    View
} from '@/components/ui';
import UserManagement from '@/components/admin/UserManagement';
import GamesManagement from '@/components/admin/GamesManagement';
import NotificationsManagement from '@/components/admin/NotificationsManagement';
import styles from './styles.module.css';
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
                    console.log('userProfile', userProfile);
                    if (userProfile?.admin) {
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                        router.push('/play'); // Redirect non-admin users
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

    // Show loading while checking admin status
    if (checkingAdmin || !auth) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '1.2rem',
                color: '#666'
            }}>
                Checking admin privileges...
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    const tabs = [
        { id: 'users' as TabType, label: 'Users', count: null },
        { id: 'games' as TabType, label: 'Games', count: null },
        { id: 'notifications' as TabType, label: 'Notifications', count: null },
    ];

    const renderTabContent = () => {
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
        <div className={styles.adminContainer}>
            <Flex $direction="column" $gap="2rem">
                {/* Header */}
                <Flex $direction="column" $gap="1rem" $alignItems="flex-start">
                    <Heading as="h1">Admin Dashboard</Heading>
                    <View $width="100%" $padding="0">
                        <Flex $gap="0.5rem" className={styles.tabContainer}>
                            {tabs.map((tab) => (
                                <Button
                                    key={tab.id}
                                    $variation={activeTab === tab.id ? 'primary' : 'secondary'}
                                    size="small"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
                                >
                                    {tab.label}
                                    {tab.count !== null && (
                                        <span className={styles.tabCount}>({tab.count})</span>
                                    )}
                                </Button>
                            ))}
                        </Flex>
                    </View>
                </Flex>

                {/* Tab Content */}
                <Card className={styles.tabContent}>
                    {renderTabContent()}
                </Card>
            </Flex>
        </div>
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