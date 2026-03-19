'use client';

import { ThemeProvider } from 'styled-components';
import { theme } from '@/theme';
import Nav from '@/components/layout/Nav';
import { GlobalStyles } from '@/theme/GlobalStyles';
import Footer from '@/components/layout/Footer';
import SkyBackground from '@/components/layout/SkyBackground';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider theme={theme}>
            <GlobalStyles />
            <SkyBackground>
                <Nav />
                {children}
                <Footer />
            </SkyBackground>
        </ThemeProvider>
    );
}