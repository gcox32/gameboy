'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import outputs from '../../../amplify_outputs.json';

Amplify.configure(outputs);

import '../../styles/styles.css';
import '../../styles/modal.css';

export default function PlayLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('login');
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
            {children}
        </div>
    );
}