'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// styles
import '../../styles/styles.css';
import '../../styles/modal.css';

export default function PlayLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return null;
    }

    return (
        <div>
            {/* Common authenticated layout element */}
            <nav>
                {/* Add navigation items here */}
            </nav>
            {children}
        </div>
    );
}