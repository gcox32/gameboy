'use client';

import { InputHTMLAttributes, useState } from 'react';
import clsx from 'clsx';
import styles from './PasswordInput.module.css';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
    autoComplete: 'current-password' | 'new-password';
};

/** Password field with a show/hide toggle; the toggle sits inside the field so the layout matches a plain input. */
export default function PasswordInput({ className, ...props }: Props) {
    const [visible, setVisible] = useState(false);

    return (
        <div className={styles.pwField}>
            <input {...props} type={visible ? 'text' : 'password'} className={clsx(className, styles.pwInput)} />
            <button
                type="button"
                className={styles.pwToggle}
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
            >
                {visible ? 'Hide' : 'Show'}
            </button>
        </div>
    );
}
