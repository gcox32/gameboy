'use client';

import React from 'react';
import Link from 'next/link';
import { useProtectedNavigation } from '@/hooks/useProtectedNavigation';
import GameInterruptModal from '@/components/modals/utilities/GameInterruptModal';
import styles from './styles.module.css';
import { footerConfig } from './config';

export default function Footer() {
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
          {footerConfig.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => handleStaticPageNavigation(e, link.href)}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className={styles.footerCopyright}>
          {currentYear} {footerConfig.copyright}
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