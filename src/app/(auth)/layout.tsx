'use client';

import { Amplify } from 'aws-amplify';
import outputs from '../../../amplify_outputs.json';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/theme';
import Nav from '@/components/layout/Nav';
import { GlobalStyles } from '@/theme/GlobalStyles';
Amplify.configure(outputs);

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider theme={theme}>
            <GlobalStyles />
            <Nav />
            {children}
        </ThemeProvider>
    );
}