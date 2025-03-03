import React from 'react';
import Image from 'next/image';
import styles from './styles.module.css';

interface ProfilePopoutProps {
    userProfile: any;
    avatarUrl: string | null;
    onAvatarClick: () => void;
    onProfileClick: () => void;
    onLogoutClick: () => void;
    isOpen: boolean;
}

const ProfilePopout = ({
    userProfile,
    avatarUrl,
    onAvatarClick,
    onProfileClick,
    onLogoutClick,
    isOpen
}: ProfilePopoutProps) => {
    return (
        <div className={styles.container}>
            <button 
                className={styles.avatarButton}
                onClick={onAvatarClick}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                {avatarUrl ? (
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

            {isOpen && (
                <div 
                    className={styles.dropdown}
                    role="menu"
                    aria-orientation="vertical"
                >
                    <button 
                        onClick={onProfileClick}
                        className={styles.dropdownItem}
                        role="menuitem"
                    >
                        Profile
                    </button>
                    <button 
                        onClick={onLogoutClick}
                        className={styles.dropdownItem}
                        role="menuitem"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfilePopout;