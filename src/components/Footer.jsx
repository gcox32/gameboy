import React from 'react';
import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-links">
        <Link href="/terms">Terms</Link>
        <Link href="/privacy-policy">Privacy Policy</Link>
      </div>
      <div className="footer-copyright">
        © {currentYear} letmedemo.com. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;