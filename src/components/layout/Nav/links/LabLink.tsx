import { FaFlask } from 'react-icons/fa';
import iconStyles from '@/styles/icons.module.css';
import Link from 'next/link';

export default function LabLink() {
    return (
        <Link
            href="/lab"
            className={iconStyles.navIconButton}
            aria-label="Oak's Lab"
        >
            <FaFlask className={iconStyles.navIcon} />
            <span className={iconStyles.label}>Oak's Lab</span>
        </Link>
    );
}
