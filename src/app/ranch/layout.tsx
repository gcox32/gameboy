'use client';

import { ThemeProvider } from 'styled-components';
import { theme } from '@/theme';
import { GlobalStyles } from '@/theme/GlobalStyles';
import { ReactNode } from 'react';

export default function RanchLayout({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider theme={theme}>
            <GlobalStyles />
            {children}
        </ThemeProvider>
    );
}
