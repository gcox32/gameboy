'use client';

import { useState } from 'react';
import OverviewPanel from '@/components/admin/OverviewPanel';
import UserManagement from '@/components/admin/UserManagement';
import GamesManagement from '@/components/admin/GamesManagement';
import NotificationsManagement from '@/components/admin/NotificationsManagement';
import StorageTab from '@/components/admin/StorageTab';
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
    notifications: 'Notifications',
    storage: 'Storage',
};

export default function AdminDashboardClient({ initialTab }: { initialTab: TabType }) {
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);

    // Kept in the URL so a refresh, the back button and links land on the same tab. Next keeps
    // its router in step with replaceState, without a trip to the server.
    const changeTab = (tab: TabType) => {
        setActiveTab(tab);
        window.history.replaceState(null, '', tab === 'overview' ? '/admin' : `/admin?tab=${tab}`);
    };

    return (
        <AdminDashboard>
            <SidebarNavigation activeTab={activeTab} onTabChange={changeTab} />
            <AdminMain>
                <AdminHeader>
                    <h2>{tabTitles[activeTab]}</h2>
                </AdminHeader>
                <AdminContent>
                    {/* The overview and storage lay out their own cards; the tables sit in one panel */}
                    {activeTab === 'overview' ? <OverviewPanel /> : activeTab === 'storage' ? <StorageTab /> : (
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
