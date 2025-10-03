'use client'

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Footer from '@/components/layout/Footer';
import styles from './(auth)/styles.module.css';
import Nav from '@/components/layout/Nav';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/theme';
import { GlobalStyles } from '@/theme/GlobalStyles';
import buttons from '@/styles/buttons.module.css';

export default function Home() {
  const auth = useAuth();
  if (!auth) throw new Error('Auth context not available');
  const { user } = auth;

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
        <Nav />
        <div className={styles.container}>
          <h1 className={styles.title}>Welcome to JS GBC</h1>
      <p className={styles.description}>Play Gameboy Color games in your browser.</p>
      {user === null ? (
        <div className={buttons.buttonGroup} style={{ marginTop: '1rem', flexDirection: 'row', justifyContent: 'center' }}>
          <Link href="login">
            <button className={buttons.primaryButton}>Login</button>
          </Link>
          <Link href="signup">
            <button className={buttons.secondaryButton}>Sign Up</button>
          </Link>
      </div>
      ) : (
        <div className={buttons.buttonGroup}>
          <Link href="/play">
            <button className={buttons.primaryButton}>Play</button>
          </Link>
        </div>
      )}
      
      </div>
      <Footer />
    </ThemeProvider>
  );
}