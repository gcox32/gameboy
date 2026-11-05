import { FaUserShield } from 'react-icons/fa';
import iconStyles from '@/styles/icons.module.css';
import Link from 'next/link';
import { ProtectedNavigateHandler } from '@/hooks/useProtectedNavigation';

export default function AdminLink({ onNavigate }: { onNavigate: ProtectedNavigateHandler }) {
    return (
        <Link
            href="/admin"
            className={iconStyles.navIconButton}
            aria-label="Admin"
            onClick={(e) => onNavigate(e, '/admin')}
        >
            <FaUserShield />
            <span className={iconStyles.label}>Admin</span>
        </Link>
    );
}
