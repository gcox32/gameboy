'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { Text } from '@/components/ui';
import { ensureOk } from './useAdminTable';
import styles from '@/styles/admin.module.css';

/** What the composer hands over to send, as POST /api/notifications takes it */
export interface NotificationPayload {
    userId: string;
    type: 'SYSTEM' | 'INFO';
    title: string;
    body: string;
    expiresAt?: string;
}

interface Account { userId: string; email: string; username: string }

const MAX_TITLE = 120;
const MAX_BODY = 2000;
const DAY = 24 * 60 * 60 * 1000;

const EXPIRY_CHOICES = [
    { value: 'never', label: 'Never' },
    { value: '1', label: 'After 1 day' },
    { value: '3', label: 'After 3 days' },
    { value: '7', label: 'After a week' },
    { value: '30', label: 'After 30 days' },
    { value: 'date', label: 'On a date…' },
];

/** yyyy-mm-dd in local time, as a date input wants it */
const dateInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

const accountLabel = (a: Account) => (a.username && a.username !== a.email ? `${a.email} (${a.username})` : a.email);

interface NotificationComposerProps {
    /** Sends to this account only, without the choice of recipient */
    recipient?: { userId: string; label: string };
    saving: boolean;
    /** Resolves to whether it was sent; the form clears when it was */
    onSend: (payload: NotificationPayload) => Promise<boolean>;
    onCancel: () => void;
}

export default function NotificationComposer({ recipient, saving, onSend, onCancel }: NotificationComposerProps) {
    const id = useId();
    const [to, setTo] = useState<'everyone' | 'one'>(recipient ? 'one' : 'everyone');
    const [accountText, setAccountText] = useState('');
    // Matches for what's typed so far, from the server; the picked one is kept even after the list moves on
    const [accounts, setAccounts] = useState<Account[] | null>(null);
    const [picked, setPicked] = useState<Account | null>(null);
    const [type, setType] = useState<NotificationPayload['type']>('SYSTEM');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [expiry, setExpiry] = useState('never');
    const [expiryDate, setExpiryDate] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Asks the server for accounts matching what's typed, after a pause in typing
    useEffect(() => {
        if (recipient || to !== 'one') return;
        // Once one's picked, the box holds its label, which isn't worth searching for
        const text = picked ? '' : accountText.trim();
        let stale = false;
        const timer = setTimeout(() => {
            const params = new URLSearchParams({ pageSize: '10', sort: 'email', dir: 'asc', ...(text && { q: text }) });
            fetch(`/api/admin/users?${params}`)
                .then((r) => ensureOk(r, 'Failed to load accounts'))
                .then((r) => r.json())
                .then((page: { rows: Account[] }) => { if (!stale) setAccounts(page.rows); })
                .catch((err: Error) => { if (!stale) setError(err.message); });
        }, 250);
        return () => { stale = true; clearTimeout(timer); };
    }, [recipient, to, accountText, picked]);

    // Choosing from the list, or typing an exact email, picks that account; any other edit unpicks it
    const typeAccount = (value: string) => {
        setAccountText(value);
        const text = value.trim().toLowerCase();
        setPicked(accounts?.find((a) => accountLabel(a).toLowerCase() === text || a.email.toLowerCase() === text) ?? null);
    };

    const chosen = useMemo(() => {
        if (recipient) return recipient.userId;
        if (to === 'everyone') return 'BROADCAST';
        return picked?.userId ?? null;
    }, [recipient, to, picked]);

    const today = new Date();
    const minDate = dateInput(new Date(today.getTime() + DAY));
    const maxDate = dateInput(new Date(today.getTime() + 365 * DAY));

    /** When it expires, or undefined for never; null while a date still needs picking */
    const expiresAt = useMemo((): string | undefined | null => {
        if (expiry === 'never') return undefined;
        if (expiry === 'date') {
            // The end of the chosen day, where the admin is
            return expiryDate ? new Date(`${expiryDate}T23:59:59`).toISOString() : null;
        }
        return new Date(Date.now() + Number(expiry) * DAY).toISOString();
    }, [expiry, expiryDate]);

    const missing = !title.trim() ? 'Add a title'
        : !body.trim() ? 'Add a message'
        : !chosen ? 'Pick an account from the list'
        : expiresAt === null ? 'Pick the date it expires'
        : null;

    const send = async () => {
        if (missing || !chosen || expiresAt === null) return;
        setError(null);
        const sent = await onSend({
            userId: chosen, type, title: title.trim(), body: body.trim(),
            ...(expiresAt && { expiresAt }),
        });
        if (sent) {
            setTitle('');
            setBody('');
        }
    };

    const recipientName = recipient ? recipient.label : to === 'everyone' ? 'everyone' : 'them';

    return (
        <form
            className={styles.composer}
            aria-label="New notification"
            onSubmit={(e) => { e.preventDefault(); send(); }}
        >
            <div className={styles.composerFields}>
                <div className={styles.formGroup}>
                    <span className={styles.formLabel} id={`${id}-to`}>To</span>
                    {recipient ? (
                        <Text>{recipient.label}</Text>
                    ) : (
                        <div className={styles.composerChoice} role="radiogroup" aria-labelledby={`${id}-to`}>
                            <label><input type="radio" name={`${id}-to`} checked={to === 'everyone'} onChange={() => setTo('everyone')} /> Everyone</label>
                            <label><input type="radio" name={`${id}-to`} checked={to === 'one'} onChange={() => setTo('one')} /> One account</label>
                        </div>
                    )}
                    {!recipient && to === 'one' && (
                        <>
                            <input
                                type="text"
                                list={`${id}-accounts`}
                                aria-label="Account"
                                placeholder={accounts ? 'Start typing an email…' : 'Loading accounts…'}
                                value={accountText}
                                onChange={(e) => typeAccount(e.target.value)}
                                className={styles.formInput}
                                autoComplete="off"
                            />
                            <datalist id={`${id}-accounts`}>
                                {accounts?.map((a) => <option key={a.userId} value={accountLabel(a)} />)}
                            </datalist>
                        </>
                    )}
                </div>

                <label className={styles.formGroup}>
                    <span className={styles.formLabel}>Kind</span>
                    <select value={type} onChange={(e) => setType(e.target.value as NotificationPayload['type'])} className={styles.formInput}>
                        <option value="SYSTEM">System</option>
                        <option value="INFO">Info</option>
                    </select>
                </label>

                <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor={`${id}-expiry`}>Expires</label>
                    <select id={`${id}-expiry`} value={expiry} onChange={(e) => setExpiry(e.target.value)} className={styles.formInput}>
                        {EXPIRY_CHOICES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    {expiry === 'date' && (
                        <input
                            type="date"
                            aria-label="Expiry date"
                            min={minDate}
                            max={maxDate}
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className={styles.formInput}
                        />
                    )}
                </div>
            </div>

            <label className={styles.formGroup}>
                <span className={styles.formLabel}>Title <span className={styles.muted}>{title.trim().length}/{MAX_TITLE}</span></span>
                <input type="text" value={title} maxLength={MAX_TITLE} onChange={(e) => setTitle(e.target.value)} className={styles.formInput} />
            </label>
            <label className={styles.formGroup}>
                <span className={styles.formLabel}>Message</span>
                <textarea value={body} maxLength={MAX_BODY} onChange={(e) => setBody(e.target.value)} className={styles.formInput} rows={3} />
            </label>

            {error && <Text fontSize="sm" variation="error">{error}</Text>}

            <div className={styles.composerActions}>
                <Text fontSize="sm" variation="secondary">
                    {missing ?? (expiresAt
                        ? `Goes to ${recipientName}, and disappears ${new Date(expiresAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}.`
                        : `Goes to ${recipientName}, and stays until deleted.`)}
                </Text>
                <div className={styles.composerButtons}>
                    <button type="button" className={styles.modalCancelButton} onClick={onCancel} disabled={saving}>Cancel</button>
                    <button type="submit" className={styles.modalPrimaryButton} disabled={!!missing || saving}>
                        {saving ? 'Sending…' : 'Send'}
                    </button>
                </div>
            </div>
        </form>
    );
}
