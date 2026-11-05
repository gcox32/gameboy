'use client';

import { ButtonHTMLAttributes, CSSProperties, ReactNode, RefObject, useEffect } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

interface PopoverProps {
    isOpen: boolean;
    onClose: () => void;
    /** Must be `position: relative` and hold the trigger, so clicking the trigger doesn't count as outside */
    containerRef: RefObject<HTMLElement | null>;
    ariaLabel: string;
    role?: 'dialog' | 'menu';
    width?: number;
    /** Distance from the panel's right edge to the caret, to line it up with the trigger */
    caretRight?: number;
    children: ReactNode;
}

export default function Popover({
    isOpen,
    onClose,
    containerRef,
    ariaLabel,
    role = 'dialog',
    width = 240,
    caretRight = 14,
    children,
}: PopoverProps) {
    useEffect(() => {
        if (!isOpen) return;
        const handlePointerDown = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) onClose();
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                // Stops here so the page behind doesn't also react. An open modal claims Escape first.
                event.stopPropagation();
                onClose();
            }
        };
        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, containerRef]);

    if (!isOpen) return null;

    return (
        <div
            className={styles.popover}
            role={role}
            aria-label={ariaLabel}
            style={{ width, '--popover-caret-right': `${caretRight}px` } as CSSProperties}
        >
            <div className={styles.content}>{children}</div>
        </div>
    );
}

interface PopoverHeaderProps {
    /** Small caps heading. Leave it out to lay out custom children instead */
    title?: string;
    action?: ReactNode;
    children?: ReactNode;
}

export function PopoverHeader({ title, action, children }: PopoverHeaderProps) {
    return (
        <div className={styles.header}>
            {title && <span className={styles.headerTitle}>{title}</span>}
            {children}
            {action}
        </div>
    );
}

export function PopoverDivider() {
    return <div className={styles.divider} />;
}

interface PopoverItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: ReactNode;
}

export function PopoverItem({ icon, className, children, ...props }: PopoverItemProps) {
    return (
        <button type="button" className={clsx(styles.item, className)} {...props}>
            {icon && <span className={styles.itemIcon}>{icon}</span>}
            {children}
        </button>
    );
}
