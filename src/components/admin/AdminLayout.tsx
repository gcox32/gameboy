'use client';

import { FC, ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const AdminDashboard: FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div
    data-theme="dark"
    className={cn('flex min-h-screen bg-[#0d1120] text-[var(--foreground-rgb)]', className)}
    {...props}
  >
    {children}
  </div>
);

export const AdminSidebar: FC<HTMLAttributes<HTMLElement>> = ({ className, children, ...props }) => (
  <aside
    className={cn(
      'w-[260px] flex-shrink-0 flex flex-col sticky top-0 h-screen',
      'bg-[rgba(13,17,32,0.75)] backdrop-blur-[12px] saturate-[130%]',
      'border-r border-[rgba(255,255,255,0.07)] shadow-[4px_0_24px_rgba(0,0,0,0.3)]',
      className
    )}
    {...props}
  >
    {children}
  </aside>
);

export const SidebarBrand: FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('p-6 border-b border-[rgba(255,255,255,0.07)]', className)} {...props}>
    {children}
  </div>
);

export const SidebarNav: FC<HTMLAttributes<HTMLElement>> = ({ className, children, ...props }) => (
  <nav className={cn('flex-1 py-4 overflow-y-auto', className)} {...props}>
    {children}
  </nav>
);

export const SidebarFooter: FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('p-3 border-t border-[rgba(255,255,255,0.07)]', className)} {...props}>
    {children}
  </div>
);

export const NavSection: FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('px-3 mb-6', className)} {...props}>
    {children}
  </div>
);

export const NavSectionTitle: FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div
    className={cn('text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-[var(--neutral-500)] px-3 mb-2', className)}
    {...props}
  >
    {children}
  </div>
);

interface NavItemProps extends HTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const NavItem: FC<NavItemProps> = ({ active, className, children, ...props }) => (
  <button
    className={cn(
      'relative flex items-center gap-3 w-full px-3 py-3 border-none rounded-lg cursor-pointer text-sm text-left transition-all duration-150',
      active
        ? 'bg-[rgba(123,104,166,0.18)] text-[rgba(255,255,255,0.92)] font-semibold'
        : 'bg-transparent text-[rgba(255,255,255,0.45)] font-medium hover:bg-[rgba(255,255,255,0.06)] hover:text-[rgba(255,255,255,0.85)]',
      className
    )}
    {...props}
  >
    {active && (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-[#7b68a6] rounded-r-sm" />
    )}
    {children}
  </button>
);

export const NavItemBadge: FC<HTMLAttributes<HTMLSpanElement>> = ({ className, children, ...props }) => (
  <span
    className={cn('ml-auto bg-[#7b68a6] text-white text-[0.625rem] font-semibold px-2 py-0.5 rounded-[10px] min-w-5 text-center', className)}
    {...props}
  >
    {children}
  </span>
);

export const AdminMain: FC<HTMLAttributes<HTMLElement>> = ({ className, children, ...props }) => (
  <main className={cn('flex-1 flex flex-col min-w-0 w-[calc(100%-260px)] overflow-hidden', className)} {...props}>
    {children}
  </main>
);

export const AdminHeader: FC<HTMLAttributes<HTMLElement>> = ({ className, children, ...props }) => (
  <header className={cn('px-8 py-6 border-b border-[rgba(255,255,255,0.07)] bg-transparent', className)} {...props}>
    {children}
  </header>
);

export const AdminContent: FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('flex-1 p-8 overflow-y-auto overflow-x-hidden min-h-[500px] w-full', className)} {...props}>
    {children}
  </div>
);

export const ContentPanel: FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div
    className={cn(
      'bg-[rgba(20,20,40,0.5)] rounded-xl border border-[rgba(255,255,255,0.07)]',
      'shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[8px]',
      'min-h-[500px] p-4 w-full overflow-x-auto',
      className
    )}
    {...props}
  >
    {children}
  </div>
);
