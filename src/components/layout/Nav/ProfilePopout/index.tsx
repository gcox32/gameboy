import React, { useEffect, useRef } from 'react';
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
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (containerRef.current && !containerRef.current.contains(target)) {
                onAvatarClick();
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onAvatarClick();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onAvatarClick]);
    return (
        <div className={styles.container} ref={containerRef}>
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