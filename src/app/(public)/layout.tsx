'use client';

import { ThemeProvider } from 'styled-components';
import { theme } from '@/theme';
import Nav from '@/components/layout/Nav';
import { GlobalStyles } from '@/theme/GlobalStyles';
import Footer from '@/components/layout/Footer';
import StarfieldContainer from '@/components/layout/StarfieldContainer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider theme={theme}>
            <GlobalStyles />
            <StarfieldContainer>
                <Nav />
                {children}
                <Footer />
            </StarfieldContainer>
        </ThemeProvider>
    );
}