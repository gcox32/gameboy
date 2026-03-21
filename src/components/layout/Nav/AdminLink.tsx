import { FaUserShield } from 'react-icons/fa';
import iconStyles from '@/styles/icons.module.css';
import Link from 'next/link';

export default function AdminLink() {
    return (
        <Link
            href="/admin"
            className={iconStyles.navIconButton}
            aria-label="Admin"
        >
            <FaUserShield />
            <span className={iconStyles.label}>Admin</span>
        </Link>
    );
}
