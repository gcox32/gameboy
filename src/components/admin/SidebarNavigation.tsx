'use client';

import React from 'react';
import { FaUsers, FaGamepad, FaBell } from 'react-icons/fa';
import {
    AdminSidebar,
    SidebarBrand,
    SidebarNav,
    NavSection,
    NavSectionTitle,
    NavItem,
    NavItemBadge
} from './AdminLayout';

type TabType = 'users' | 'games' | 'notifications';

interface NavItemConfig {
    id: TabType;
    label: string;
    icon: React.ReactNode;
    count?: number | null;
}

interface SidebarNavigationProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

const navItems: NavItemConfig[] = [
    { id: 'users', label: 'Users', icon: <FaUsers /> },
    { id: 'games', label: 'Games', icon: <FaGamepad /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
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
                            $active={activeTab === item.id}
                            onClick={() => onTabChange(item.id)}
                        >
                            {item.icon}
                            {item.label}
                            {item.count != null && item.count > 0 && (
                                <NavItemBadge>{item.count}</NavItemBadge>
                            )}
                        </NavItem>
                    ))}
                </NavSection>
            </SidebarNav>
        </AdminSidebar>
    );
}
