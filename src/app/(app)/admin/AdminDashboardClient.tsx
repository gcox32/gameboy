'use client';

import { useState } from 'react';
import OverviewPanel from '@/components/admin/OverviewPanel';
import UserManagement from '@/components/admin/UserManagement';
import GamesManagement from '@/components/admin/GamesManagement';
import NotificationsManagement from '@/components/admin/NotificationsManagement';
import SidebarNavigation, { TabType } from '@/components/admin/SidebarNavigation';
import {
    AdminDashboard,
    AdminMain,
    AdminHeader,
    AdminContent,
    ContentPanel
} from '@/components/admin/AdminLayout';

const tabTitles: Record<TabType, string> = {
    overview: 'Overview',
    users: 'User Management',
    games: 'Games Management',
    notifications: 'Notifications'
};

export default function AdminDashboardClient() {
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    return (
        <AdminDashboard>
            <SidebarNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            <AdminMain>
                <AdminHeader>
                    <h2>{tabTitles[activeTab]}</h2>
                </AdminHeader>
                <AdminContent>
                    {/* The overview lays out its own cards; the tables sit in one panel */}
                    {activeTab === 'overview' ? <OverviewPanel /> : (
                    <ContentPanel>
                        {activeTab === 'users' && <UserManagement />}
                        {activeTab === 'games' && <GamesManagement />}
                        {activeTab === 'notifications' && <NotificationsManagement />}
                    </ContentPanel>
                    )}
                </AdminContent>
            </AdminMain>
        </AdminDashboard>
    );
}
