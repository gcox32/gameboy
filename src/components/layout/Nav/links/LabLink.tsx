import { FaFlask } from 'react-icons/fa';
import iconStyles from '@/styles/icons.module.css';
import Link from 'next/link';
import { ProtectedNavigateHandler } from '@/hooks/useProtectedNavigation';

export default function LabLink({ onNavigate }: { onNavigate: ProtectedNavigateHandler }) {
    return (
        <Link
            href="/lab"
            className={iconStyles.navIconButton}
            aria-label="Oak's Lab"
            onClick={(e) => onNavigate(e, '/lab')}
        >
            <FaFlask className={iconStyles.navIcon} />
            <span className={iconStyles.label}>Oak's Lab</span>
        </Link>
    );
}
