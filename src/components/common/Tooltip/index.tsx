import { ReactNode } from 'react';
import styles from './styles.module.css';

interface TooltipProps {
    label: string;
    /** Fixed width, so a set of neighboring tooltips match. Leave it out to fit the label */
    width?: number;
    /** Should name itself for screen readers (e.g. aria-label), since the tooltip is visual only */
    children: ReactNode;
}

/** Replaces the native `title`. The wrapper takes the hover, so it still works on a disabled child. */
export default function Tooltip({ label, width, children }: TooltipProps) {
    return (
        <span className={styles.wrapper}>
            {children}
            <span className={styles.tooltip} style={{ width }} aria-hidden="true">{label}</span>
        </span>
    );
}
