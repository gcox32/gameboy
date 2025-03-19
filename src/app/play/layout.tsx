'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/theme';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import outputs from '../../../amplify_outputs.json';
import Nav from '@/components/layout/Nav';
import { GlobalStyles } from '@/theme/GlobalStyles';

Amplify.configure(outputs);

export default function PlayLayout({ children }: { children: ReactNode }) {
    const auth = useAuth();
    if (!auth) throw new Error('Auth context not available');
    const { user, loading } = auth;
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
        <ThemeProvider theme={theme}>
            <GlobalStyles />
            <Nav />
            {children}
        </ThemeProvider>
    );
}