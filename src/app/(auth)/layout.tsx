'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/theme';
import { GlobalStyles } from '@/theme/GlobalStyles';
import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authedRoute } from '@/../config';
import SkyBackground from '@/components/layout/SkyBackground';
import HomeLink from '@/components/layout/HomeLink';
import styles from './styles.module.css';

export default function Layout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const auth = useAuth();
    
    useEffect(() => {
        if (auth) {
            const { user, loading } = auth;
            // Redirect logged-in users away from auth pages
            if (!loading && user) {
                router.push(authedRoute);
            }
        }
    }, [auth, router]);

    // Don't render auth pages if user is logged in
    if (auth && !auth.loading && auth.user) {
        return null;
    }

    return (
        <ThemeProvider theme={theme}>
            <GlobalStyles />
            <SkyBackground>
                <HomeLink className={styles.homeLink}>← Home</HomeLink>
                <Suspense fallback={<p>Loading...</p>}>
                    {children}
                </Suspense>
            </SkyBackground>
        </ThemeProvider>
    );
}