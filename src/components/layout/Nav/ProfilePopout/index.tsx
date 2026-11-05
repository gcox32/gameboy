import { useRef } from 'react';
import Image from 'next/image';
import styles from './styles.module.css';
import { FaCog, FaSignOutAlt, FaUser, FaUserShield } from 'react-icons/fa';
import Popover, { PopoverDivider, PopoverHeader, PopoverItem } from '@/components/common/Popover';
import { ProfileModel } from '@/types';

interface ProfilePopoutProps {
    userProfile: ProfileModel | null;
    avatarUrl: string | null;
    onAvatarClick: () => void;
    onProfileClick: () => void;
    onSettingsClick: () => void;
    /** Only given to admins */
    onAdminClick?: () => void;
    onLogoutClick: () => void;
    isOpen: boolean;
    onClose: () => void;
}

const ProfilePopout = ({
    userProfile,
    avatarUrl,
    onAvatarClick,
    onProfileClick,
    onSettingsClick,
    onAdminClick,
    onLogoutClick,
    isOpen,
    onClose
}: ProfilePopoutProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    return (
        <div className={styles.container} ref={containerRef}>
            <button
                className={styles.avatarButton}
                onClick={onAvatarClick}
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
                <PopoverItem role="menuitem" icon={<FaCog />} onClick={onSettingsClick}>Settings</PopoverItem>
                {onAdminClick && (
                    <PopoverItem role="menuitem" icon={<FaUserShield />} onClick={onAdminClick}>Admin</PopoverItem>
                )}
                <PopoverDivider />
                <PopoverItem role="menuitem" icon={<FaSignOutAlt />} onClick={onLogoutClick}>Logout</PopoverItem>
            </Popover>
        </div>
    );
};

export default ProfilePopout;
