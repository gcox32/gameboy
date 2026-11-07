'use client';

import { FormEvent, useState } from 'react';
import clsx from 'clsx';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { RanchPen } from './types';
import styles from './styles.module.css';

/** Matches PEN_NAME_MAX on the server */
const NAME_MAX = 20;

interface PenTabsProps {
    pens: RanchPen[];
    activeId: string;
    capacity: number;
    countOf: (penId: string) => number;
    onPick: (penId: string) => void;
    onAdd: () => Promise<void>;
    onRename: (penId: string, name: string) => Promise<boolean>;
    onRemove: (penId: string) => Promise<void>;
}

/** A tab per pen with how full it is, and the tools for the pen on show */
export function PenTabs({ pens, activeId, capacity, countOf, onPick, onAdd, onRename, onRemove }: PenTabsProps) {
    const [renaming, setRenaming] = useState(false);
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const active = pens.find(p => p.id === activeId);
    const canRemove = !!active && pens.length > 1 && countOf(active.id) === 0;

    const run = async (fn: () => Promise<unknown>) => {
        setBusy(true);
        try { await fn(); } finally { setBusy(false); }
    };

    const startRename = () => {
        if (!active) return;
        setName(active.name);
        setRenaming(true);
    };

    const submitRename = (e: FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!active || !trimmed || trimmed === active.name) { setRenaming(false); return; }
        run(async () => { if (await onRename(active.id, trimmed)) setRenaming(false); });
    };

    return (
        <div className={styles.penBar}>
            <div className={styles.penTabs} role="tablist" aria-label="Pens">
                {pens.map(pen => {
                    const count = countOf(pen.id);
                    const isActive = pen.id === activeId;
                    if (isActive && renaming) {
                        return (
                            <form key={pen.id} className={clsx(styles.penTab, styles.penTabActive)} onSubmit={submitRename}>
                                <input
                                    className={styles.penNameInput}
                                    value={name}
                                    maxLength={NAME_MAX}
                                    onChange={e => setName(e.target.value)}
                                    onKeyDown={e => e.key === 'Escape' && setRenaming(false)}
                                    aria-label="Pen name"
                                    autoFocus
                                    disabled={busy}
                                />
                                <button type="submit" className={styles.penTool} aria-label="Save name" disabled={busy}>
                                    <Check size={14} aria-hidden />
                                </button>
                                <button type="button" className={styles.penTool} aria-label="Cancel" onClick={() => setRenaming(false)}>
                                    <X size={14} aria-hidden />
                                </button>
                            </form>
                        );
                    }
                    return (
                        <button
                            key={pen.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={clsx(styles.penTab, isActive && styles.penTabActive)}
                            onClick={() => { setRenaming(false); onPick(pen.id); }}
                            onDoubleClick={isActive ? startRename : undefined}
                        >
                            <span className={styles.penName}>{pen.name}</span>
                            <span className={clsx(styles.penCount, count >= capacity && styles.penFull)}>
                                {count}/{capacity}
                            </span>
                        </button>
                    );
                })}
                <button
                    type="button"
                    className={styles.penAdd}
                    onClick={() => run(onAdd)}
                    disabled={busy}
                    aria-label="New pen"
                    title="New pen"
                >
                    <Plus size={16} aria-hidden />
                </button>
            </div>

            {active && !renaming && (
                <div className={styles.penTools}>
                    <button type="button" className={styles.penTool} onClick={startRename} aria-label="Rename pen" title="Rename pen">
                        <Pencil size={14} aria-hidden />
                    </button>
                    {canRemove && (
                        <button
                            type="button"
                            className={styles.penTool}
                            onClick={() => run(() => onRemove(active.id))}
                            disabled={busy}
                            aria-label="Remove pen"
                            title="Remove pen"
                        >
                            <Trash2 size={14} aria-hidden />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
