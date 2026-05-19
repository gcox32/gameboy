'use client';

import { ReactNode, Suspense, useEffect } from 'react';
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
            if (!loading && user) {
                router.push(authedRoute);
            }
        }
    }, [auth, router]);

    if (auth && !auth.loading && auth.user) {
        return null;
    }

    return (
        <SkyBackground>
            <HomeLink className={styles.homeLink}>← Home</HomeLink>
            <Suspense fallback={<p>Loading...</p>}>
                {children}
            </Suspense>
        </SkyBackground>
    );
}
