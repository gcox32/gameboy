'use client';

import { useEffect, useState } from 'react';
import { ArrowDownToLine, Check, Copy, X } from 'lucide-react';
import { DeckKey, DeckPill, LabDeck, LabStage, Platform } from './LabStage';
import { SaveMonitor, slotEntry, slotKey } from './LabSave';
import type { LabSave } from './useLabSave';
import styles from './lab.module.css';

/** Leave a Pokémon: send one Pokémon from a save to the Ranch, or clone it there */
export default function ExtractTab({ lab }: { lab: LabSave }) {
    const [selectedKey, setSelectedKey] = useState('');
    const { contents, loadedFilePath, refresh, notify } = lab;
    const party = contents?.party ?? [];
    const all = contents ? [...contents.party, ...contents.boxes.flat()] : [];
    const chosen = all.find(s => slotKey(s) === selectedKey) ?? null;

    // Slots only mean something in the file they were read from.
    useEffect(() => { setSelectedKey(''); }, [loadedFilePath]);

    // The last one in the party has to stay
    const emptiesParty = party.length === 1 && !!chosen && slotKey(party[0]) === selectedKey;

    // Which way the Pokémon are going, while the request runs
    const [busy, setBusy] = useState<'' | 'move' | 'clone'>('');
    // Removing asks first, in case a clone would do
    const [confirming, setConfirming] = useState(false);

    // A different selection needs asking about again
    useEffect(() => { setConfirming(false); }, [selectedKey]);

    const send = async (mode: 'move' | 'clone') => {
        if (!chosen || !contents || (mode === 'move' && emptiesParty)) return;
        setBusy(mode);
        const slots = [{
            location: chosen.location,
            ...(chosen.location === 'box' ? { boxNumber: chosen.boxNumber } : {}),
            slotIndex: chosen.slotIndex,
        }];

        try {
            const res = await fetch('/api/pokemon/stored', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ saveStateId: lab.selectedSave?.id, slots, expectedFilePath: loadedFilePath, mode }),
            });

            if (res.ok) {
                notify(mode === 'clone'
                    ? `${chosen.nickname} cloned to the Ranch!`
                    : `${chosen.nickname} sent to the Ranch!`, 'success');
                // A clone leaves the file as it was, so the selection wouldn't clear by itself
                setSelectedKey('');
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

    const none = !chosen;
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
                    {!chosen ? (
                        <p>Choose a Pokémon on the monitor to send it from this save to the Ranch, or to clone it there.</p>
                    ) : confirming ? (
                        <>
                            <p className={styles.deckWarn}>Remove {chosen.nickname} from this save?</p>
                            <p>It&apos;ll leave the game for the Ranch. To keep it in the game as well, clone it instead.</p>
                        </>
                    ) : (
                        <>
                            <ul className={styles.deckList}>
                                <li>
                                    <span>{chosen.nickname}</span>
                                    <span className={styles.deckListMeta}>
                                        {chosen.location === 'party' ? 'Party' : `Box ${chosen.boxNumber}`} · Lv. {chosen.level}
                                    </span>
                                </li>
                            </ul>
                            <p className={styles.deckHint}>
                                {busy === 'clone' ? 'Cloning...' : busy === 'move' ? 'Sending...' : 'Ready to send or clone.'}
                            </p>
                        </>
                    )}

                    {emptiesParty && !confirming && (
                        <p className={styles.deckWarn}>At least one Pokémon must stay in your party. You can still clone it.</p>
                    )}
                </LabDeck>
            }
            platform={<Platform entries={chosen ? [slotEntry(chosen)] : []} />}
            monitor={
                <SaveMonitor
                    lab={lab}
                    cursorKey={selectedKey}
                    // A second click puts it back
                    onPick={s => setSelectedKey(prev => prev === slotKey(s) ? '' : slotKey(s))}
                    onCursor={s => setSelectedKey(slotKey(s))}
                />
            }
        />
    );
}
