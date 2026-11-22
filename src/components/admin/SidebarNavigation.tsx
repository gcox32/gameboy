'use client';

import { ReactNode } from 'react';
import { FaChartBar, FaUsers, FaGamepad, FaBell, FaHdd, FaArrowLeft } from 'react-icons/fa';
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

export const TABS = ['overview', 'users', 'games', 'notifications', 'storage'] as const;
export type TabType = (typeof TABS)[number];

export const isTab = (value: unknown): value is TabType => TABS.includes(value as TabType);

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
