import { FaHorse } from 'react-icons/fa';
import iconStyles from '@/styles/icons.module.css';
import Link from 'next/link';

export default function RanchLink() {
    return (
        <Link
            href="/ranch"
            className={iconStyles.navIconButton}
            aria-label="Oak's Ranch"
        >
            <FaHorse />
            <span className={iconStyles.label}>Oak's Ranch</span>
        </Link>
    );
}
