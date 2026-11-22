// Plain module, not 'use client': the admin page reads the tab on the server
export const TABS = ['overview', 'users', 'games', 'notifications', 'storage', 'activity'] as const;
export type TabType = (typeof TABS)[number];

export const isTab = (value: unknown): value is TabType => TABS.includes(value as TabType);
