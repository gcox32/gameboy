'use client';

import { useState } from 'react';
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

import { ThemeProvider } from 'styled-components';
import { theme } from '@/theme';
import { GlobalStyles } from '@/theme/GlobalStyles';
import { ToastProvider } from '@/components/ui';
import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';

type TabType = 'users' | 'games' | 'notifications';

function Admin() {
    const [activeTab, setActiveTab] = useState<TabType>('users');

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