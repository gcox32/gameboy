'use client';

import React from 'react';
import Link from 'next/link';
import { useProtectedNavigation } from '@/hooks/useProtectedNavigation';
import GameInterruptModal from '@/components/modals/GameInterruptModal';

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
      <footer className="footer">
        <div className="footer-links">
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
        <div className="footer-copyright">
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