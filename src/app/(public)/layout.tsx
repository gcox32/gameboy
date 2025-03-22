'use client';

import { ThemeProvider } from 'styled-components';
import { theme } from '@/theme';
import Nav from '@/components/layout/Nav';
import { GlobalStyles } from '@/theme/GlobalStyles';
import Footer from '@/components/layout/Footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider theme={theme}>
            <GlobalStyles />
            <Nav />
            {children}
            <Footer />
        </ThemeProvider>
    );
}