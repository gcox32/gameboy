'use client';

import { ReactNode } from 'react';
import { FaUsers, FaGamepad, FaBell, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import {
    AdminSidebar,
    SidebarBrand,
    SidebarNav,
    SidebarFooter,
    NavSection,
    NavSectionTitle,
    NavItem,
    NavItemBadge
} from './AdminLayout';

type TabType = 'users' | 'games' | 'notifications';

interface NavItemConfig {
    id: TabType;
    label: string;
    icon: ReactNode;
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
                            active={activeTab === item.id}
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
            <SidebarFooter>
                <Link href="/play" className="relative flex items-center gap-3 w-full px-3 py-3 rounded-lg cursor-pointer text-sm text-left transition-all duration-150 bg-transparent text-[rgba(255,255,255,0.45)] font-medium hover:bg-[rgba(255,255,255,0.06)] hover:text-[rgba(255,255,255,0.85)]">
                    <FaArrowLeft />
                    Back to Game
                </Link>
            </SidebarFooter>
        </AdminSidebar>
    );
}
