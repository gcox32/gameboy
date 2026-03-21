'use client';

import styled from 'styled-components';

export const AdminDashboard = styled.div.attrs({ 'data-theme': 'dark' })`
    display: flex;
    min-height: 100vh;
    background: #0d1120;
    color: var(--foreground-rgb);
`;

export const AdminSidebar = styled.aside`
    width: 260px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;

    background: rgba(13, 17, 32, 0.75);
    -webkit-backdrop-filter: blur(12px) saturate(130%);
    backdrop-filter: blur(12px) saturate(130%);
    border-right: 1px solid rgba(255, 255, 255, 0.07);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
`;

export const SidebarBrand = styled.div`
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);

    h1 {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
        color: rgba(255, 255, 255, 0.92);
        letter-spacing: 2px;
        text-shadow: 0 2px 16px rgba(0, 0, 0, 0.4);
    }

    span {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.35);
        text-transform: uppercase;
        letter-spacing: 0.12em;
    }
`;

export const SidebarNav = styled.nav`
    flex: 1;
    padding: 1rem 0;
    overflow-y: auto;
`;

export const SidebarFooter = styled.div`
    padding: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
`;

export const NavSection = styled.div`
    padding: 0 0.75rem;
    margin-bottom: 1.5rem;
`;

export const NavSectionTitle = styled.div`
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--neutral-500);
    padding: 0 0.75rem;
    margin-bottom: 0.5rem;
`;

interface NavItemProps {
    $active?: boolean;
}

export const NavItem = styled.button<NavItemProps>`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    border: none;
    background: ${props => props.$active ? 'rgba(123, 104, 166, 0.18)' : 'transparent'};
    border-radius: 8px;
    cursor: pointer;
    color: ${props => props.$active ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.45)'};
    font-size: 0.875rem;
    font-weight: ${props => props.$active ? '600' : '500'};
    text-align: left;
    transition: all 0.15s ease;
    position: relative;

    ${props => props.$active && `
        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 60%;
            background: #7b68a6;
            border-radius: 0 2px 2px 0;
        }
    `}

    &:hover {
        background: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.85);
    }

    svg {
        font-size: 1.125rem;
        flex-shrink: 0;
    }
`;

export const NavItemBadge = styled.span`
    margin-left: auto;
    background: #7b68a6;
    color: white;
    font-size: 0.625rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    border-radius: 10px;
    min-width: 1.25rem;
    text-align: center;
`;

export const AdminMain = styled.main`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0; /* Prevent flex item from overflowing */
    width: calc(100% - 260px); /* Fixed width relative to sidebar */
    overflow: hidden;
`;

export const AdminHeader = styled.header`
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    background: transparent;

    h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
        color: rgba(255, 255, 255, 0.92);
        letter-spacing: 1px;
    }
`;

export const AdminContent = styled.div`
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 500px; /* Prevents content area height jumps */
    width: 100%;
`;

export const ContentPanel = styled.div`
    background: rgba(20, 20, 40, 0.5);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(8px);
    min-height: 500px;
    padding: 1rem;
    width: 100%;
    overflow-x: auto;
`;
