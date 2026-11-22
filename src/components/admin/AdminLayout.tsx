'use client';

import { FC, HTMLAttributes, ComponentProps } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

/*
 * The admin shell. On phones (below md) the sidebar becomes a bar across the top, its items in a
 * row, and the content takes the full width; tables scroll sideways inside their panel.
 */

export const AdminDashboard: FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div
    data-theme="dark"
    className={cn('flex max-md:flex-col w-full min-w-0 min-h-screen bg-[#0d1120] text-[var(--foreground-rgb)]', className)}
    {...props}
  >
    {children}
  </div>
);

export const AdminSidebar: FC<HTMLAttributes<HTMLElement>> = ({ className, children, ...props }) => (
  <aside
    className={cn(
      'w-[260px] flex-shrink-0 flex flex-col sticky top-0 h-screen z-10',
      'max-md:w-full max-md:h-auto max-md:flex-row max-md:items-center',
      'bg-[rgba(13,17,32,0.75)] backdrop-blur-[12px] saturate-[130%]',
      'border-r max-md:border-r-0 max-md:border-b border-[rgba(255,255,255,0.07)] shadow-[4px_0_24px_rgba(0,0,0,0.3)]',
      className
    )}
    {...props}
  >
    {children}
  </aside>
);

export const SidebarBrand: FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('p-6 border-b border-[rgba(255,255,255,0.07)] max-md:hidden', className)} {...props}>
    {children}
  </div>
);

export const SidebarNav: FC<HTMLAttributes<HTMLElement>> = ({ className, children, ...props }) => (
  <nav className={cn('flex-1 py-4 overflow-y-auto max-md:py-2 max-md:overflow-x-auto max-md:overflow-y-hidden', className)} {...props}>
    {children}
  </nav>
);

export const SidebarFooter: FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('p-3 border-t border-[rgba(255,255,255,0.07)] max-md:p-2 max-md:border-t-0 max-md:border-l', className)} {...props}>
    {children}
  </div>
);

export const NavSection: FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('px-3 mb-6 max-md:mb-0 max-md:px-2 max-md:flex max-md:gap-1', className)} {...props}>
    {children}
  </div>
);

export const NavSectionTitle: FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div
    className={cn('text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-[var(--neutral-500)] px-3 mb-2 max-md:hidden', className)}
    {...props}
  >
    {children}
  </div>
);

const navItemBase =
  'relative flex items-center gap-3 w-full px-3 py-3 border-none rounded-lg cursor-pointer text-sm text-left transition-all duration-150 '
  + 'max-md:w-auto max-md:whitespace-nowrap max-md:py-2';
const navItemIdle =
  'bg-transparent text-[rgba(255,255,255,0.45)] font-medium hover:bg-[rgba(255,255,255,0.06)] hover:text-[rgba(255,255,255,0.85)]';

interface NavItemProps extends HTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const NavItem: FC<NavItemProps> = ({ active, className, children, ...props }) => (
  <button
    aria-current={active ? 'page' : undefined}
    className={cn(
      navItemBase,
      active ? 'bg-[rgba(123,104,166,0.18)] text-[rgba(255,255,255,0.92)] font-semibold' : navItemIdle,
      className
    )}
    {...props}
  >
    {active && (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-[#7b68a6] rounded-r-sm max-md:hidden" />
    )}
    {children}
  </button>
);

export const NavItemLink: FC<ComponentProps<typeof Link>> = ({ className, children, ...props }) => (
  <Link className={cn(navItemBase, navItemIdle, className)} {...props}>
    {children}
  </Link>
);

export const AdminMain: FC<HTMLAttributes<HTMLElement>> = ({ className, children, ...props }) => (
  <main className={cn('flex-1 flex flex-col min-w-0 overflow-hidden', className)} {...props}>
    {children}
  </main>
);

export const AdminHeader: FC<HTMLAttributes<HTMLElement>> = ({ className, children, ...props }) => (
  <header className={cn('px-8 py-6 max-md:px-4 max-md:py-4 border-b border-[rgba(255,255,255,0.07)] bg-transparent', className)} {...props}>
    {children}
  </header>
);

export const AdminContent: FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('flex-1 p-8 max-md:p-4 overflow-y-auto overflow-x-hidden w-full', className)} {...props}>
    {children}
  </div>
);

export const ContentPanel: FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div
    className={cn(
      'bg-[rgba(20,20,40,0.5)] rounded-xl border border-[rgba(255,255,255,0.07)]',
      'shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[8px]',
      'p-4 max-md:p-2 w-full overflow-x-auto',
      className
    )}
    {...props}
  >
    {children}
  </div>
);
