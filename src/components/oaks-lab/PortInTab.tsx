'use client';

import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { RanchPokemon } from '@/components/ranch/types';
import paper from '@/components/modals/paper.module.css';
import ConnectModal from './ConnectModal';
import { LabEntry, LabPanel, LabStage, Monitor, Platform } from './LabStage';
import { BoxesNotReadyNote } from './LabSave';
import type { LabSave } from './useLabSave';
import styles from './lab.module.css';

const ranchEntry = (p: RanchPokemon): LabEntry => ({
    key: p.id,
    speciesIndex: p.speciesIndex,
    nickname: p.nickname,
    level: p.level,
});

/** Take a Pokémon: send a Pokémon from the Ranch into a save */
export default function PortInTab({ lab }: { lab: LabSave }) {
    const { selectedGame, selectedSave, currentSave, contents, notify } = lab;
    const [ranch, setRanch] = useState<RanchPokemon[] | null>(null);
    const [selectedId, setSelectedId] = useState('');
    const [targetSlotType, setTargetSlotType] = useState<'party' | 'box'>('party');
    const [targetBoxNumber, setTargetBoxNumber] = useState(1);
    const [porting, setPorting] = useState(false);
    const [connectModalOpen, setConnectModalOpen] = useState(false);

    const selectedPokemon = ranch?.find(p => p.id === selectedId) ?? null;
    const connected = !!currentSave?.connected;
    const partyCount = contents?.party.length ?? 0;
    const boxCounts = contents?.boxes.map(b => b.length) ?? [];

    const fetchRanch = useCallback(async () => {
        try {
            const data = await fetch('/api/pokemon/stored').then(r => r.json());
            setRanch(data);
        } catch {
            setRanch([]);
        }
    }, []);

    useEffect(() => { fetchRanch(); }, [fetchRanch]);

    // Don't leave a box selected that this save can't use.
    useEffect(() => {
        if (!contents) return;
        setTargetBoxNumber(prev => contents.boxAvailable[prev - 1] ? prev : contents.boxAvailable.indexOf(true) + 1);
    }, [contents]);

    const handlePort = async () => {
        if (!selectedPokemon || !selectedSave?.id) return;
        setPorting(true);
        const targetSlot = targetSlotType === 'party'
            ? { location: 'party', slotIndex: 0 }
            : { location: 'box', boxNumber: targetBoxNumber, slotIndex: 0 };

        try {
            const res = await fetch(`/api/pokemon/stored/${selectedPokemon.id}/port`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetSaveStateId: selectedSave.id, targetSlot }),
            });

            if (res.ok) {
                notify(`${selectedPokemon.nickname} sent to ${currentSave?.title ?? 'your game'}!`, 'success');
            } else {
                const err = await res.json().catch(() => ({}));
                notify(err.error ?? 'Something went wrong.', 'error');
            }
            // Either way, show what's there now. A new file reloads the save's contents.
            setSelectedId('');
            await Promise.all([fetchRanch(), lab.refresh()]);
        } catch {
            notify('Something went wrong. Check your connection and try again.', 'error');
        } finally {
            setPorting(false);
        }
    };

    const isFull = targetSlotType === 'party'
        ? partyCount >= 6
        : (boxCounts[targetBoxNumber - 1] ?? 0) >= 20;
    const nextSlot = targetSlotType === 'party'
        ? `Party — slot ${partyCount + 1}`
        : `Box ${targetBoxNumber} — slot ${(boxCounts[targetBoxNumber - 1] ?? 0) + 1}`;

    let destination;
    if (!selectedGame || !selectedSave?.id) {
        destination = <p className={styles.panelText}>Choose a game and save file below to send it to.</p>;
    } else if (!connected) {
        destination = (
            <>
                <p className={styles.panelText}>
                    This save is not connected to Oak&apos;s Lab. Connect it first to receive Pokémon.
                </p>
                <div className={styles.panelActions}>
                    <button type="button" className={paper.secondaryButton} onClick={() => setConnectModalOpen(true)}>
                        Connect to Lab
                    </button>
                </div>
            </>
        );
    } else if (!contents) {
        destination = <p className={styles.panelText}>{lab.loadingSave ? 'Loading save file...' : 'Could not read this save.'}</p>;
    } else {
        destination = (
            <>
                <div className={styles.segmented} role="radiogroup" aria-label="Target slot">
                    {(['party', 'box'] as const).map(loc => (
                        <button
                            key={loc}
                            type="button"
                            role="radio"
                            aria-checked={targetSlotType === loc}
                            className={clsx(styles.segment, targetSlotType === loc && styles.segmentActive)}
                            onClick={() => setTargetSlotType(loc)}
                            disabled={loc === 'party' && partyCount >= 6}
                        >
                            {loc === 'party' ? `Party (${partyCount}/6)` : 'PC Box'}
                        </button>
                    ))}
                </div>

                {targetSlotType === 'box' && (
                    <>
                        <div className={styles.boxPicker}>
                            {boxCounts.map((count, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={clsx(styles.boxPick, targetBoxNumber === i + 1 && styles.boxPickActive)}
                                    onClick={() => setTargetBoxNumber(i + 1)}
                                    disabled={count >= 20 || !contents.boxAvailable[i]}
                                    title={`Box ${i + 1} (${count}/20)`}
                                >
                                    <span>{i + 1}</span>
                                    <small>{count}/20</small>
                                </button>
                            ))}
                        </div>
                        <BoxesNotReadyNote boxAvailable={contents.boxAvailable} className={styles.panelNote} />
                    </>
                )}

                {selectedPokemon && (
                    <p className={styles.panelText}>
                        Send <strong>{selectedPokemon.nickname}</strong> to {nextSlot}
                    </p>
                )}
                <div className={styles.panelActions}>
                    <button
                        type="button"
                        className={paper.primaryButton}
                        onClick={handlePort}
                        disabled={!selectedPokemon || porting || isFull}
                    >
                        {porting ? 'Sending...' : isFull ? 'Full' : `Send to ${currentSave?.title ?? 'Game'}`}
                    </button>
                </div>
            </>
        );
    }

    const entries = (ranch ?? []).map(ranchEntry);
    const select = (e: LabEntry) => setSelectedId(e.key);

    return (
        <>
            <LabStage
                panel={
                    <LabPanel title="Take a Pokémon">
                        {!selectedPokemon && (
                            <p className={styles.panelText}>Select a Pokémon from your Ranch to port into the target save.</p>
                        )}
                        <h3 className={styles.panelHeading}>Target Slot</h3>
                        {destination}
                    </LabPanel>
                }
                platform={
                    <Platform
                        entries={selectedPokemon ? [ranchEntry(selectedPokemon)] : []}
                        emptyText="No Pokémon on the platform"
                    />
                }
                monitor={
                    <Monitor
                        title="Ranch"
                        meta={ranch ? `${ranch.length}` : undefined}
                        entries={entries}
                        cursorKey={selectedId}
                        onPick={e => setSelectedId(prev => prev === e.key ? '' : e.key)}
                        onCursor={select}
                        screen={ranch === null ? <p className={styles.blink}>Loading Ranch...</p> : undefined}
                        emptyText="No Pokémon at the Ranch."
                    />
                }
            />
            <ConnectModal
                isOpen={connectModalOpen}
                onClose={() => setConnectModalOpen(false)}
                saveStateId={selectedSave?.id ?? ''}
                gameId={selectedGame?.id ?? ''}
                fetchSaveStates={lab.fetchSaveStates}
            />
        </>
    );
}
