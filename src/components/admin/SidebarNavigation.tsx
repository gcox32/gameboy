'use client';

import { ReactNode } from 'react';
import { FaChartBar, FaUsers, FaGamepad, FaBell, FaHdd, FaHistory, FaArrowLeft } from 'react-icons/fa';
import {
    AdminSidebar,
    SidebarBrand,
    SidebarNav,
    SidebarFooter,
    NavSection,
    NavSectionTitle,
    NavItem,
    NavItemLink,
} from './AdminLayout';
import type { TabType } from './tabs';


interface NavItemConfig {
    id: TabType;
    label: string;
    icon: ReactNode;
}

interface SidebarNavigationProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

const navItems: NavItemConfig[] = [
    { id: 'overview', label: 'Overview', icon: <FaChartBar /> },
    { id: 'users', label: 'Users', icon: <FaUsers /> },
    { id: 'games', label: 'Games', icon: <FaGamepad /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
    { id: 'storage', label: 'Storage', icon: <FaHdd /> },
    { id: 'activity', label: 'Activity', icon: <FaHistory /> },
];

export default function SidebarNavigation({ activeTab, onTabChange }: SidebarNavigationProps) {
    return (
        <AdminSidebar>
            <SidebarBrand>
                <span>Admin</span>
                <h1>Dashboard</h1>
            </SidebarBrand>

            <SidebarNav>
                <NavSection>
                    <NavSectionTitle>Management</NavSectionTitle>
                    {navItems.map((item) => (
                        <NavItem
                            key={item.id}
                            active={activeTab === item.id}
                            onClick={() => onTabChange(item.id)}
                        >
                            {item.icon}
                            {item.label}
                        </NavItem>
                    ))}
                </NavSection>
            </SidebarNav>
            <SidebarFooter>
                <NavItemLink href="/play">
                    <FaArrowLeft />
                    Back to Game
                </NavItemLink>
            </SidebarFooter>
        </AdminSidebar>
    );
}
