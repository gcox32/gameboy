import styles from './styles.module.css';
import Link from 'next/link';
import { useProtectedNavigation } from '@/hooks/useProtectedNavigation';
import { footerConfig } from '@/components/layout/Footer/config';

interface MobileFooterProps {
    setIsMenuOpen: (isOpen: boolean) => void;
}

export default function MobileFooter({ setIsMenuOpen }: MobileFooterProps) {
    const { handleStaticPageNavigation } = useProtectedNavigation();
    
    return (
        <div className={styles.mobileFooterLinks}>
            {footerConfig.links.map((link) => (
                <Link 
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                        handleStaticPageNavigation(e, link.href);
                        setIsMenuOpen(false);
                    }}
                >
                    {link.label}
                </Link>
            ))}
    </div>
    );
}