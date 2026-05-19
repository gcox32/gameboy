import { FaGamepad } from 'react-icons/fa';
import iconStyles from '@/styles/icons.module.css';
import Link from 'next/link';

export default function PlayLink() {
    return (
        <Link
            href="/play"
            className={iconStyles.navIconButton}
            aria-label="Oak's Lab"
        >
            <FaGamepad className={iconStyles.navIcon} />
            <span className={iconStyles.label}>Play</span>
        </Link>
    );
}
