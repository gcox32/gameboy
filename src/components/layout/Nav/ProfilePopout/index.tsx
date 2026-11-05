import { useRef, useMemo, useState } from 'react';
import Image from 'next/image';
import styles from './styles.module.css';
import dynamic from 'next/dynamic';
import { FaSignOutAlt, FaUser } from 'react-icons/fa';
import Popover, { PopoverDivider, PopoverHeader, PopoverItem } from '@/components/common/Popover';
import { ProfileModel } from '@/types';

const MobileMenu = dynamic(() => import('@/components/common/MobileMenu'), { ssr: false });

interface ProfilePopoutProps {
    userProfile: ProfileModel | null;
    avatarUrl: string | null;
    onAvatarClick: () => void;
    onProfileClick: () => void;
    onLogoutClick: () => void;
    isOpen: boolean;
    onClose: () => void;
}

const ProfilePopout = ({
    userProfile,
    avatarUrl,
    onAvatarClick,
    onProfileClick,
    onLogoutClick,
    isOpen,
    onClose
}: ProfilePopoutProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // crude mobile detection via window width; can be swapped for CSS/Context
    const isMobile = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth <= 768; // tailwind md breakpoint equivalent
    }, []);


    return (
        <div className={styles.container} ref={containerRef}>
            <button 
                className={styles.avatarButton}
                onClick={() => {
                    if (isMobile) {
                        setIsMobileMenuOpen(true);
                    } else {
                        onAvatarClick();
                    }
                }}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                {userProfile && avatarUrl ? (
                    <Image
                        src={avatarUrl}
                        alt={userProfile.username}
                        title={userProfile.username}
                        width={40}
                        height={40}
                        className={styles.avatar}
                    />
                ) : (
                    <div className={styles.avatarPlaceholder}>
                        {userProfile?.username?.charAt(0).toUpperCase() || ''}
                    </div>
                )}
            </button>

            {!isMobile && (
                <Popover isOpen={isOpen} onClose={onClose} containerRef={containerRef} ariaLabel="Account menu" role="menu">
                    {userProfile && (
                        <PopoverHeader>
                            <div className={styles.identity}>
                                <div className={styles.username}>{userProfile.username}</div>
                                <div className={styles.email}>{userProfile.email}</div>
                            </div>
                        </PopoverHeader>
                    )}
                    <PopoverItem role="menuitem" icon={<FaUser />} onClick={onProfileClick}>Profile</PopoverItem>
                    <PopoverDivider />
                    <PopoverItem role="menuitem" icon={<FaSignOutAlt />} onClick={onLogoutClick}>Logout</PopoverItem>
                </Popover>
            )}
            {isMobile && (
                <MobileMenu
                    isOpen={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                    onProfile={() => {
                        onProfileClick();
                        setIsMobileMenuOpen(false);
                    }}
                    onLogout={() => {
                        onLogoutClick();
                        setIsMobileMenuOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default ProfilePopout;