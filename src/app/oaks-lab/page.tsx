'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import OaksLab from '@/components/oaks-lab/OaksLab';
import Nav from '@/components/layout/Nav';

export default function OaksLabPage() {
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
            <OaksLab />
        </>
    );
}
