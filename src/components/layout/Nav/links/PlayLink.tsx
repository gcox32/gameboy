import { FaGamepad } from 'react-icons/fa';
import iconStyles from '@/styles/icons.module.css';
import Link from 'next/link';
import { ProtectedNavigateHandler } from '@/hooks/useProtectedNavigation';

export default function PlayLink({ onNavigate }: { onNavigate: ProtectedNavigateHandler }) {
    return (
        <Link
            href="/play"
            className={iconStyles.navIconButton}
            aria-label="Play"
            onClick={(e) => onNavigate(e, '/play')}
        >
            <FaGamepad className={iconStyles.navIcon} />
            <span className={iconStyles.label}>Play</span>
        </Link>
    );
}
