import React, { useEffect, useState, useCallback, useRef } from 'react';
import styles from './styles.module.css';

type MobileMenuProps = {
    isOpen: boolean;
    onClose: () => void;
    onProfile: () => void;
    onLogout: () => void;
};

export default function MobileMenu({ isOpen, onClose, onProfile, onLogout }: MobileMenuProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [isHidden, setIsHidden] = useState(true);
    const hideTimeoutRef = useRef<number | undefined>(undefined);

    const beginHide = useCallback(() => {
        setIsHidden(true);
        // match CSS transition (~150-200ms). Use 200ms like the legacy script.
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = window.setTimeout(() => {
            setIsMounted(false);
            onClose();
            // restore scrolling
            if (typeof document !== 'undefined') {
                document.body.style.overflow = '';
            }
        }, 50);
    }, [onClose]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            beginHide();
        }
    }, [beginHide]);

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            // prevent body scroll while menu is open
            if (typeof document !== 'undefined') {
                document.body.style.overflow = 'hidden';
            }
            // let it mount hidden first, then remove hidden to animate in
            requestAnimationFrame(() => setIsHidden(false));
            document.addEventListener('keydown', handleKeyDown);
        } else if (isMounted) {
            beginHide();
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, isMounted, beginHide, handleKeyDown]);

    useEffect(() => () => window.clearTimeout(hideTimeoutRef.current), []);

    if (!isMounted) return null;

    return (
        <div
            id="screen-menu"
            className={`${styles.screenMenu} ${isHidden ? styles.hidden : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            // ensure overlay covers the viewport even if CSS misses it
            style={{ position: 'fixed', inset: 0, display: 'block' }}
        >
            <div
                id="game-menu"
                className={`${styles.menu} ${isHidden ? styles.hidden : ''}`}
                onClick={(e) => e.stopPropagation()}
                style={{ display: 'block' }}
            >
                <ul>
                    <li
                        onClick={() => {
                            onProfile();
                            beginHide();
                        }}
                    >
                        Profile
                    </li>
                    <li
                        onClick={() => {
                            onLogout();
                            beginHide();
                        }}
                    >
                        Logout
                    </li>
                </ul>
                <ul>
                    <li
                        className={styles.default}
                        onClick={beginHide}
                        id="menu-button-cancel"
                    >
                        Cancel
                    </li>
                </ul>
            </div>
        </div>
    );
}