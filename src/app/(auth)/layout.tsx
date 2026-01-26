'use client';

import { Amplify } from 'aws-amplify';
import outputs from '../../../amplify_outputs.json';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/theme';
import { GlobalStyles } from '@/theme/GlobalStyles';
import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authedRoute } from '@/../config';
import StarfieldContainer from '@/components/layout/StarfieldContainer';
import Footer from '@/components/layout/Footer';
Amplify.configure(outputs);

export default function Layout({ children }: { children: React.ReactNode }) {
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
            <StarfieldContainer>
                <Suspense fallback={<p>Loading...</p>}>
                    {children}
                </Suspense>
                <Footer />
            </StarfieldContainer>
        </ThemeProvider>
    );
}