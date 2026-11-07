'use client';

import { useEffect, useState } from 'react';
import { SlotPokemon } from '@/utils/pokemon/gen1Save';
import paper from '@/components/modals/paper.module.css';
import { LabPanel, LabStage, Platform } from './LabStage';
import { SaveMonitor, slotEntry, slotKey } from './LabSave';
import type { LabSave } from './useLabSave';
import styles from './lab.module.css';

/** Leave a Pokémon: send Pokémon from a save to the Ranch */
export default function ExtractTab({ lab }: { lab: LabSave }) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [cursorKey, setCursorKey] = useState('');
    const [sending, setSending] = useState(false);
    const { contents, loadedFilePath, refresh, notify } = lab;
    const party = contents?.party ?? [];
    const all = contents ? [...contents.party, ...contents.boxes.flat()] : [];
    const chosen = all.filter(s => selected.has(slotKey(s)));

    // Slots only mean something in the file they were read from.
    useEffect(() => { setSelected(new Set()); }, [loadedFilePath]);

    const toggle = (key: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const pick = (s: SlotPokemon) => {
        setCursorKey(slotKey(s));
        toggle(slotKey(s));
    };

    const cursorOnPage = lab.pageSlots.some(s => slotKey(s) === cursorKey);
    const emptiesParty = party.length > 0 && party.every(s => selected.has(slotKey(s)));

    const handleSend = async () => {
        if (!selected.size || emptiesParty || !contents) return;
        setSending(true);
        const slots = chosen.map(s => ({
            location: s.location,
            ...(s.location === 'box' ? { boxNumber: s.boxNumber } : {}),
            slotIndex: s.slotIndex,
        }));

        try {
            const res = await fetch('/api/pokemon/stored', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ saveStateId: lab.selectedSave?.id, slots, expectedFilePath: loadedFilePath }),
            });

            if (res.ok) {
                const { created } = await res.json();
                notify(`${created.length} Pokémon sent to the Ranch!`, 'success');
            } else {
                const err = await res.json().catch(() => ({}));
                notify(err.error ?? 'Something went wrong.', 'error');
            }
            // On success this shows the new file. On a conflict, whatever is there now.
            await refresh();
        } catch {
            notify('Something went wrong. Check your connection and try again.', 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <LabStage
            panel={
                <LabPanel title="Leave a Pokémon">
                    {chosen.length === 0 ? (
                        <p className={styles.panelText}>
                            Choose Pokémon on the monitor to send them from this save to the Ranch.
                        </p>
                    ) : (
                        <ul className={styles.panelList}>
                            {chosen.map(s => (
                                <li key={slotKey(s)}>
                                    <span>{s.nickname}</span>
                                    <span className={styles.panelListMeta}>
                                        {s.location === 'party' ? 'Party' : `Box ${s.boxNumber}`} · Lv. {s.level}
                                    </span>
                                    <button
                                        type="button"
                                        className={styles.panelListRemove}
                                        onClick={() => toggle(slotKey(s))}
                                        aria-label={`Remove ${s.nickname}`}
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {emptiesParty && (
                        <p className={styles.panelWarning}>At least one Pokémon must stay in your party</p>
                    )}

                    <div className={styles.panelActions}>
                        <button
                            type="button"
                            className={paper.primaryButton}
                            onClick={handleSend}
                            disabled={sending || emptiesParty || chosen.length === 0}
                        >
                            {sending ? 'Sending...' : 'Send to Ranch'}
                        </button>
                    </div>
                </LabPanel>
            }
            platform={<Platform entries={chosen.map(slotEntry)} emptyText="No Pokémon on the platform" />}
            monitor={
                <SaveMonitor
                    lab={lab}
                    cursorKey={cursorKey}
                    markedKeys={selected}
                    onPick={pick}
                    onCursor={s => setCursorKey(slotKey(s))}
                    action={{
                        label: cursorOnPage && selected.has(cursorKey) ? 'Put back' : 'Select',
                        onClick: () => toggle(cursorKey),
                        disabled: !cursorOnPage,
                    }}
                />
            }
        />
    );
}
