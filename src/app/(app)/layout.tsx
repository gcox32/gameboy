'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GamesProvider } from '@/contexts/GamesContext';
import { CurrentGameProvider } from '@/contexts/CurrentGameContext';
import { APP_SHELL_ID } from '@/lib/appShell';
import Nav from '@/components/layout/Nav';
import { ToastProvider } from '@/components/ui';
import styles from './layout.module.css';

// Everything behind login shares one nav, so it survives moving between pages
export default function AppLayout({ children }: { children: ReactNode }) {
    const auth = useAuth();
    if (!auth) throw new Error('Auth context not available');
    const { user, loading } = auth;
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    if (loading || !user) return null;

    return (
        <div id={APP_SHELL_ID} className={styles.shell}>
            <ToastProvider>
                <GamesProvider>
                    <CurrentGameProvider>
                        <Nav />
                        {children}
                    </CurrentGameProvider>
                </GamesProvider>
            </ToastProvider>
        </div>
    );
}
