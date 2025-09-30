'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const auth = useAuth();

    useEffect(() => {
        // Check if user is authenticated and is an admin
        if (auth) {
            const { user, loading } = auth;

            if (!loading && !user) {
                router.push('/login');
            }
        }
    }, [auth, router]);

    // Show loading or nothing while checking auth
    if (!auth) {
        return null;
    }

    return (
        <>
            {children}
        </>
    );
}
