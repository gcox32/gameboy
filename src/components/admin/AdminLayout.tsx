'use client';

import styled from 'styled-components';

export const AdminDashboard = styled.div`
    display: flex;
    min-height: 100vh;
    background-color: var(--background-color);
`;

export const AdminSidebar = styled.aside`
    width: 260px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;

    /* Glass morphism effect matching ControlPanel */
    background-color: color-mix(in srgb, var(--background-color), transparent 15%);
    -webkit-backdrop-filter: blur(10px) saturate(120%);
    backdrop-filter: blur(10px) saturate(120%);
    border-right: 1px solid color-mix(in srgb, var(--foreground-rgb), transparent 85%);
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.08);
`;

export const SidebarBrand = styled.div`
    padding: 1.5rem;
    border-bottom: 1px solid color-mix(in srgb, var(--foreground-rgb), transparent 88%);

    h1 {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
        color: var(--foreground-rgb);
    }

    span {
        font-size: 0.75rem;
        color: var(--neutral-500);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
`;

export const SidebarNav = styled.nav`
    flex: 1;
    padding: 1rem 0;
    overflow-y: auto;
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
    background: ${props => props.$active ? 'var(--hover-background-color)' : 'transparent'};
    border-radius: 8px;
    cursor: pointer;
    color: ${props => props.$active ? 'var(--foreground-rgb)' : 'var(--neutral-500)'};
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
            background: var(--button-primary-bg);
            border-radius: 0 2px 2px 0;
        }
    `}

    &:hover {
        background: var(--hover-background-color);
        color: var(--foreground-rgb);
    }

    svg {
        font-size: 1.125rem;
        flex-shrink: 0;
    }
`;

export const NavItemBadge = styled.span`
    margin-left: auto;
    background: var(--button-primary-bg);
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
    border-bottom: 1px solid var(--border-color);
    background: var(--background-color);

    h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
        color: var(--foreground-rgb);
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
    background: var(--background-color);
    border-radius: 12px;
    border: 1px solid var(--border-color);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    min-height: 500px; /* Consistent minimum height */
    padding: 1rem;
    width: 100%;
    overflow-x: auto;
`;
