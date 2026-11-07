'use client';

import { useEffect, useState } from 'react';
import { ArrowDownToLine, Copy, X } from 'lucide-react';
import { DeckKey, DeckPill, LabDeck, LabResult, useFeedStage } from '../stage';
import { slotEntry, slotKey, useSaveScreen } from '../save/LabSave';
import type { LabSave } from '../save/useLabSave';
import styles from '../lab.module.css';

/** Leave a Pokémon: send one Pokémon from a save to the Ranch, or clone it there */
export default function ExtractTab({ lab }: { lab: LabSave }) {
    const [selectedKey, setSelectedKey] = useState('');
    const { contents, loadedFilePath, refresh } = lab;
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
    // How the last send went, until it's acknowledged
    const [result, setResult] = useState<LabResult | null>(null);

    // A different selection needs asking about again
    useEffect(() => { setConfirming(false); }, [selectedKey]);

    const send = async (mode: 'move' | 'clone') => {
        if (!chosen || !contents || (mode === 'move' && emptiesParty)) return;
        setBusy(mode);
        setResult(null);
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
                setResult({
                    tone: 'success',
                    text: mode === 'clone'
                        ? `${chosen.nickname} cloned to the Ranch!`
                        : `${chosen.nickname} sent to the Ranch!`,
                });
                // A clone leaves the file as it was, so the selection wouldn't clear by itself
                setSelectedKey('');
            } else {
                const err = await res.json().catch(() => ({}));
                setResult({ tone: 'error', text: err.error ?? 'Something went wrong.' });
            }
            // On success this shows the new file. On a conflict, whatever is there now.
            await refresh();
        } catch {
            setResult({ tone: 'error', text: 'Something went wrong. Check your connection and try again.' });
        } finally {
            setBusy('');
            setConfirming(false);
        }
    };

    const none = !chosen;

    // The save on the monitor, and the chosen Pokémon on the pad
    const saveScreen = useSaveScreen(lab, {
        cursorKey: selectedKey,
        // A second click puts it back
        onPick: s => {
            setSelectedKey(prev => prev === slotKey(s) ? '' : slotKey(s));
            setResult(null);
        },
        onCursor: s => {
            setSelectedKey(slotKey(s));
            setResult(null);
        },
    });
    useFeedStage({ screens: { save: saveScreen.screen }, platform: chosen ? slotEntry(chosen) : null });

    // The same three keys throughout. Send asks first, then a second press sends; Back only works while it's asking.
    const controls = (
        <>
            <DeckPill label="Back" onClick={() => setConfirming(false)} inactive={!!busy || !confirming}>
                <X size={18} aria-hidden />
            </DeckPill>
            <DeckKey
                tone="alt"
                label={busy === 'clone' ? 'Cloning...' : 'Clone to Ranch'}
                onClick={() => send('clone')}
                inactive={!!busy || none}
            >
                <Copy size={22} strokeWidth={2.5} aria-hidden />
            </DeckKey>
            <DeckKey
                label={busy === 'move' ? 'Sending...'
                    : confirming ? 'Remove from save and send to Ranch'
                    : 'Send to Ranch'}
                onClick={() => confirming ? send('move') : setConfirming(true)}
                inactive={!!busy || emptiesParty || none}
            >
                <ArrowDownToLine size={22} strokeWidth={2.5} aria-hidden />
            </DeckKey>
        </>
    );

    return (
        <>
            <LabDeck
                title="Leave a Pokémon"
                controls={controls}
                busy={busy === 'clone' ? 'Cloning...' : busy === 'move' ? 'Sending...' : undefined}
                result={result}
                onDismissResult={() => setResult(null)}
            >
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
                        <p className={styles.deckHint}>Ready to send or clone.</p>
                    </>
                )}

                {emptiesParty && !confirming && (
                    <p className={styles.deckWarn}>At least one Pokémon must stay in your party. You can still clone it.</p>
                )}
            </LabDeck>
            {saveScreen.connectModal}
        </>
    );
}
