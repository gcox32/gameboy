'use client';

import { ReactNode } from 'react';
import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import SkyBackground from '@/components/layout/SkyBackground';

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <SkyBackground>
            <Nav />
            {children}
            <Footer />
        </SkyBackground>
    );
}
