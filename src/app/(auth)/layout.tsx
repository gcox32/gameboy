'use client';

import { ReactNode, Suspense, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authedRoute } from '@/../config';
import SkyBackground from '@/components/layout/SkyBackground';
import HomeLink from '@/components/layout/HomeLink';
import { navigateWithTransition } from '@/lib/transition';
import { useOverscrollUp } from '@/hooks/useOverscrollUp';
import styles from './styles.module.css';

export default function Layout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const auth = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);

    const goHome = useCallback(() => {
        navigateWithTransition(router.push, '/', 'down');
    }, [router.push]);

    useOverscrollUp(containerRef, goHome);

    useEffect(() => {
        if (auth) {
            const { user, loading } = auth;
            if (!loading && user) {
                router.push(authedRoute);
            }
        }
    }, [auth, router]);

    if (auth && !auth.loading && auth.user) {
        return null;
    }

    return (
        <SkyBackground ref={containerRef}>
<HomeLink className={styles.homeLink}>← Home</HomeLink>
            <Suspense fallback={<p>Loading...</p>}>
                {children}
            </Suspense>
        </SkyBackground>
    );
}
