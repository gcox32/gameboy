'use client';

import { Amplify } from 'aws-amplify';
import outputs from '../../../amplify_outputs.json';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/theme';
import { GlobalStyles } from '@/theme/GlobalStyles';
import { Suspense } from 'react';
import StarfieldContainer from '@/components/layout/StarfieldContainer';
import Footer from '@/components/layout/Footer';
Amplify.configure(outputs);

export default function Layout({ children }: { children: React.ReactNode }) {
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