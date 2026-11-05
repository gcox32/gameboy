'use client';

import { useState } from 'react';
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

type TabType = 'users' | 'games' | 'notifications';

const tabTitles: Record<TabType, string> = {
    users: 'User Management',
    games: 'Games Management',
    notifications: 'Notifications'
};

export default function AdminDashboardClient() {
    const [activeTab, setActiveTab] = useState<TabType>('users');

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
