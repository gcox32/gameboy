'use client';

import { Text } from '@/components/ui';
import { whole } from './format';
import styles from '@/styles/admin.module.css';

interface PagerProps {
    page: number;
    pageSize: number;
    total: number;
    /** What's being counted, e.g. 'user' */
    noun: string;
    busy?: boolean;
    onPage: (page: number) => void;
}

/** "26–50 of 312 users", with the way to the pages either side */
export default function Pager({ page, pageSize, total, noun, busy = false, onPage }: PagerProps) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const first = total ? (page - 1) * pageSize + 1 : 0;
    const last = Math.min(page * pageSize, total);
    const nouns = total === 1 ? noun : `${noun}s`;

    return (
        <nav className={styles.pager} aria-label={`${noun} pages`}>
            <Text fontSize="sm" variation="secondary" aria-live="polite">
                {total ? `${whole.format(first)}–${whole.format(last)} of ${whole.format(total)} ${nouns}` : `No ${nouns}`}
                {busy && ' · Loading…'}
            </Text>
            {pages > 1 && (
                <div className={styles.pagerButtons}>
                    <button type="button" className={styles.modalCancelButton} onClick={() => onPage(page - 1)} disabled={page <= 1}>
                        Previous
                    </button>
                    <Text fontSize="sm" variation="secondary">Page {page} of {pages}</Text>
                    <button type="button" className={styles.modalCancelButton} onClick={() => onPage(page + 1)} disabled={page >= pages}>
                        Next
                    </button>
                </div>
            )}
        </nav>
    );
}
