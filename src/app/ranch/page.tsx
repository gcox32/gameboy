'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import OaksRanch from '@/components/ranch/OaksRanch';
import Nav from '@/components/layout/Nav';

export default function RanchPage() {
    const auth = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (auth && !auth.loading && !auth.user) {
            router.push('/login');
        }
    }, [auth, router]);

    if (!auth || auth.loading) return null;
    if (!auth.user) return null;

    return (
        <>
            <Nav />
            <OaksRanch />
        </>
    );
}
