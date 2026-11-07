'use client';

import { useEffect, useState } from 'react';
import { SlotPokemon } from '@/utils/pokemon/gen1Save';
import { ArrowDownToLine, Check, Copy, X } from 'lucide-react';
import { DeckKey, DeckPill, LabDeck, LabStage, Platform } from './LabStage';
import { SaveMonitor, slotEntry, slotKey } from './LabSave';
import type { LabSave } from './useLabSave';
import styles from './lab.module.css';

/** Leave a Pokémon: send Pokémon from a save to the Ranch, or clone them there */
export default function ExtractTab({ lab }: { lab: LabSave }) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [cursorKey, setCursorKey] = useState('');
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

    // Which way the Pokémon are going, while the request runs
    const [busy, setBusy] = useState<'' | 'move' | 'clone'>('');
    // Removing asks first, in case a clone would do
    const [confirming, setConfirming] = useState(false);

    // A different selection needs asking about again
    useEffect(() => { setConfirming(false); }, [selected]);

    const send = async (mode: 'move' | 'clone') => {
        if (!chosen.length || !contents || (mode === 'move' && emptiesParty)) return;
        setBusy(mode);
        const slots = chosen.map(s => ({
            location: s.location,
            ...(s.location === 'box' ? { boxNumber: s.boxNumber } : {}),
            slotIndex: s.slotIndex,
        }));

        try {
            const res = await fetch('/api/pokemon/stored', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ saveStateId: lab.selectedSave?.id, slots, expectedFilePath: loadedFilePath, mode }),
            });

            if (res.ok) {
                const { created } = await res.json();
                notify(mode === 'clone'
                    ? `${created.length} Pokémon cloned to the Ranch!`
                    : `${created.length} Pokémon sent to the Ranch!`, 'success');
                // A clone leaves the file as it was, so the selection wouldn't clear by itself
                setSelected(new Set());
            } else {
                const err = await res.json().catch(() => ({}));
                notify(err.error ?? 'Something went wrong.', 'error');
            }
            // On success this shows the new file. On a conflict, whatever is there now.
            await refresh();
        } catch {
            notify('Something went wrong. Check your connection and try again.', 'error');
        } finally {
            setBusy('');
            setConfirming(false);
        }
    };

    const none = chosen.length === 0;
    const cloneKey = (
        <DeckKey
            tone="alt"
            label={busy === 'clone' ? 'Cloning...' : 'Clone to Ranch'}
            onClick={() => send('clone')}
            inactive={!!busy || none}
        >
            <Copy size={22} strokeWidth={2.5} aria-hidden />
        </DeckKey>
    );

    const controls = confirming ? (
        <>
            <DeckPill label="Back" onClick={() => setConfirming(false)} inactive={!!busy}>
                <X size={18} aria-hidden />
            </DeckPill>
            {cloneKey}
            <DeckKey
                label={busy === 'move' ? 'Sending...' : 'Remove from save and send to Ranch'}
                onClick={() => send('move')}
                inactive={!!busy}
            >
                <Check size={22} strokeWidth={3} aria-hidden />
            </DeckKey>
        </>
    ) : (
        <>
            {cloneKey}
            <DeckKey
                label="Send to Ranch"
                onClick={() => setConfirming(true)}
                inactive={!!busy || emptiesParty || none}
            >
                <ArrowDownToLine size={22} strokeWidth={2.5} aria-hidden />
            </DeckKey>
        </>
    );

    return (
        <LabStage
            panel={
                <LabDeck title="Leave a Pokémon" controls={controls}>
                    {none ? (
                        <p>Choose Pokémon on the monitor to send them from this save to the Ranch, or to clone them there.</p>
                    ) : confirming ? (
                        <>
                            <p className={styles.deckWarn}>Remove {chosen.length} Pokémon from this save?</p>
                            <p>They&apos;ll leave the game for the Ranch. To keep them in the game as well, clone them instead.</p>
                        </>
                    ) : (
                        <>
                            <ul className={styles.deckList}>
                                {chosen.map(s => (
                                    <li key={slotKey(s)}>
                                        <span>{s.nickname}</span>
                                        <span className={styles.deckListMeta}>
                                            {s.location === 'party' ? 'Party' : `Box ${s.boxNumber}`} · Lv. {s.level}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <p className={styles.deckHint}>
                                {busy === 'clone' ? 'Cloning...' : busy === 'move' ? 'Sending...' : `${chosen.length} ready to send or clone.`}
                            </p>
                        </>
                    )}

                    {emptiesParty && !confirming && (
                        <p className={styles.deckWarn}>At least one Pokémon must stay in your party. You can still clone them.</p>
                    )}
                </LabDeck>
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
                        inactive: !cursorOnPage,
                    }}
                />
            }
        />
    );
}
