'use client';

import React from 'react';
import Link from 'next/link';
import { useProtectedNavigation } from '@/hooks/useProtectedNavigation';
import GameInterruptModal from '@/components/modals/utilities/GameInterruptModal';
import styles from './styles.module.css';
const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { 
    isModalOpen, 
    handleStaticPageNavigation, 
    handleContinue, 
    handleClose 
  } = useProtectedNavigation();

  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link 
            href="/play"
            onClick={(e) => handleStaticPageNavigation(e, '/play')}
          >
            Play
          </Link>
          <Link 
            href="/about"
            onClick={(e) => handleStaticPageNavigation(e, '/about')}
          >
            About
          </Link>
          <Link 
            href="/contact"
            onClick={(e) => handleStaticPageNavigation(e, '/contact')}
          >
            Contact
          </Link>
          <Link 
            href="/terms"
            onClick={(e) => handleStaticPageNavigation(e, '/terms')}
          >
            Terms
          </Link>
          <Link 
            href="/privacy-policy"
            onClick={(e) => handleStaticPageNavigation(e, '/privacy-policy')}
          >
            Privacy Policy
          </Link>
        </div>
        <div className={styles.footerCopyright}>
          © {currentYear} letmedemo.com. All rights reserved.
        </div>
      </footer>

      <GameInterruptModal 
        isOpen={isModalOpen}
        onClose={handleClose}
        onContinue={handleContinue}
      />
    </>
  );
};

export default Footer;