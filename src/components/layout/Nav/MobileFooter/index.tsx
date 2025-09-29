import styles from './styles.module.css';
import Link from 'next/link';
import { useProtectedNavigation } from '@/hooks/useProtectedNavigation';

interface MobileFooterProps {
    setIsMenuOpen: (isOpen: boolean) => void;
}

export default function MobileFooter({ setIsMenuOpen }: MobileFooterProps) {
    const { handleStaticPageNavigation } = useProtectedNavigation();
    
    return (
        <div className={styles.mobileFooterLinks}>
        <Link 
            href="/play"
            onClick={(e) => {
                setIsMenuOpen(false);
            }}
        >
            Play
        </Link>
        <Link 
            href="/about" 
            onClick={(e) => { 
                setIsMenuOpen(false);
                handleStaticPageNavigation(e, '/about'); 
            }}
        >
            About
        </Link>
        <Link 
            href="/contact" 
            onClick={(e) => { 
                setIsMenuOpen(false);
                handleStaticPageNavigation(e, '/contact'); 
            }}>
            Contact
        </Link>
        <Link 
            href="/privacy-policy" 
            onClick={(e) => {
                setIsMenuOpen(false);
                handleStaticPageNavigation(e, '/privacy-policy');
            }}
        >
            Privacy Policy
        </Link>
        <Link href="/terms" onClick={(e) => {
            setIsMenuOpen(false);
            handleStaticPageNavigation(e, '/terms');
        }}>
            Terms
        </Link>
    </div>
    );
}