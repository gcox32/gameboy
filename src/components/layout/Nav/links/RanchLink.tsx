import WindmillIcon from '@/components/icons/WindmillIcon';
import iconStyles from '@/styles/icons.module.css';
import Link from 'next/link';
import { ProtectedNavigateHandler } from '@/hooks/useProtectedNavigation';

export default function RanchLink({ onNavigate }: { onNavigate: ProtectedNavigateHandler }) {
    return (
        <Link
            href="/ranch"
            className={iconStyles.navIconButton}
            aria-label="Oak's Ranch"
            onClick={(e) => onNavigate(e, '/ranch')}
        >
            <WindmillIcon />
            <span className={iconStyles.label}>Oak's Ranch</span>
        </Link>
    );
}
