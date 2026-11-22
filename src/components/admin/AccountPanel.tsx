'use client';

import { Flex, Text } from '@/components/ui';
import { ensureOk } from './useAdminTable';
import { dateLabel, daysAgo, minutesUntil, plural } from './format';
import styles from '@/styles/admin.module.css';

export interface EmailLimit {
    action: string;
    count: number;
    max: number;
    blocked: boolean;
    resetsAt: string;
}

/** One account as the admin API describes it */
export interface UserRow {
    userId: string;
    email: string;
    emailVerified: boolean;
    admin: boolean;
    createdAt: string;
    hasProfile: boolean;
    username: string;
    bio: string;
    avatar?: string;
    games: number;
    saves: number;
    pokemon: number;
    limits: EmailLimit[];
}

export type AccountAction = 'resendVerification' | 'verifyEmail' | 'sendPasswordReset' | 'clearRateLimits';

export const isLimited = (u: UserRow) => u.limits.some((l) => l.blocked);

/** Runs an account action, resolving to the server's description of what it did */
export async function postAccountAction(userId: string, action: AccountAction): Promise<{ message: string }> {
    const res = await ensureOk(await fetch(`/api/admin/users/${userId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
    }), 'Action failed');
    return res.json();
}

/** The auth actions as people would say them */
const ACTION_NAMES: Record<string, string> = {
    login: 'Log in',
    verify: 'Enter verification code',
    resendVerification: 'Resend verification code',
    forgotPassword: 'Forgot password',
};

interface AccountPanelProps {
    account: UserRow;
    saving: boolean;
    onAction: (action: AccountAction) => void;
}

/** An account's facts, its open rate limits, and the ways to help someone get in */
export default function AccountPanel({ account, saving, onAction }: AccountPanelProps) {
    return (
        <Flex $direction="column" $gap="1.5rem">
            <dl className={styles.factList}>
                <dt>Email</dt>
                <dd>{account.email}</dd>
                <dt>Email status</dt>
                <dd>{account.emailVerified ? 'Verified' : 'Not verified yet'}</dd>
                <dt>Joined</dt>
                <dd>{dateLabel.format(new Date(account.createdAt))} ({daysAgo(account.createdAt)})</dd>
                <dt>Owns</dt>
                <dd>{plural(account.games, 'game')} · {plural(account.saves, 'save')} · {plural(account.pokemon, 'Ranch Pokémon', 'Ranch Pokémon')}</dd>
                <dt>User ID</dt>
                <dd className={styles.mono}>{account.userId}</dd>
            </dl>

            <section aria-labelledby="limits-title">
                <h4 id="limits-title" className={styles.subheading}>Rate limits</h4>
                {account.limits.length === 0 ? (
                    <Text fontSize="sm" variation="secondary">None open for this email.</Text>
                ) : (
                    <ul className={styles.limitList}>
                        {account.limits.map((l) => (
                            <li key={l.action}>
                                <span>{ACTION_NAMES[l.action] ?? l.action}</span>
                                <span className={styles.numeric}>{l.count} of {l.max}</span>
                                <span>
                                    {l.blocked && <span className={`${styles.statusBadge} ${styles.statusBadgeWarning}`}>Blocked</span>}
                                    {' '}resets {minutesUntil(l.resetsAt)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section aria-labelledby="help-title">
                <h4 id="help-title" className={styles.subheading}>Help them in</h4>
                <div className={styles.accountActions}>
                    <button type="button" className={styles.modalCancelButton} disabled={saving || account.emailVerified} onClick={() => onAction('resendVerification')}>
                        Resend verification code
                    </button>
                    <button type="button" className={styles.modalCancelButton} disabled={saving || account.emailVerified} onClick={() => onAction('verifyEmail')}>
                        Mark email verified
                    </button>
                    <button type="button" className={styles.modalCancelButton} disabled={saving} onClick={() => onAction('sendPasswordReset')}>
                        Send password reset
                    </button>
                    <button type="button" className={styles.modalCancelButton} disabled={saving || account.limits.length === 0} onClick={() => onAction('clearRateLimits')}>
                        Clear rate limits
                    </button>
                </div>
                <Text fontSize="sm" variation="secondary" className={styles.actionsHint}>
                    Emails go to {account.email}. Admin actions don&apos;t count toward their limits.
                </Text>
            </section>
        </Flex>
    );
}
