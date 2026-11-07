'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowUpFromLine, Plug } from 'lucide-react';
import { RanchPokemon } from '@/components/ranch/types';
import ConnectModal from './ConnectModal';
import { DeckKey, LabDeck, LabEntry, LabStage, Monitor, Platform, SlideSwitch, press } from './LabStage';
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
            // An error comes back as an object, which would break the list
            setRanch(Array.isArray(data) ? data : []);
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

    const ready = !!selectedGame && !!selectedSave?.id && connected && !!contents;

    let destination;
    if (!selectedGame || !selectedSave?.id) {
        destination = <p>Choose a game and save file below to send it to.</p>;
    } else if (!connected) {
        destination = <p>This save is not connected to Oak&apos;s Lab. Connect it first to receive Pokémon.</p>;
    } else if (!contents) {
        destination = <p className={lab.loadingSave ? styles.blink : undefined}>
            {lab.loadingSave ? 'Loading save file...' : 'Could not read this save.'}
        </p>;
    } else {
        destination = (
            <>
                <p className={styles.deckHint}>
                    {targetSlotType === 'party'
                        ? `Party (${partyCount}/6)`
                        : `Box ${targetBoxNumber} (${boxCounts[targetBoxNumber - 1] ?? 0}/20)`}
                </p>
                {selectedPokemon && (
                    isFull
                        ? <p className={styles.deckWarn}>Full</p>
                        : <p>Send <strong>{selectedPokemon.nickname}</strong> to {nextSlot}</p>
                )}
                {targetSlotType === 'box' && (
                    <BoxesNotReadyNote boxAvailable={contents.boxAvailable} className={styles.deckHint} />
                )}
            </>
        );
    }

    const controls = connected || !selectedSave?.id ? (
        <>
            <SlideSwitch
                small
                label="Target slot"
                options={[
                    { id: 'party', label: `Party (${partyCount}/6)`, inactive: !ready || partyCount >= 6 },
                    { id: 'box', label: 'PC Box', inactive: !ready },
                ]}
                value={targetSlotType}
                onChange={setTargetSlotType}
            />
            <DeckKey
                label={porting ? 'Sending...' : `Send to ${currentSave?.title ?? 'Game'}`}
                onClick={handlePort}
                inactive={!ready || !selectedPokemon || porting || isFull}
            >
                <ArrowUpFromLine size={22} strokeWidth={2.5} aria-hidden />
            </DeckKey>
            <div className={styles.keypad} role="radiogroup" aria-label="Box">
                {Array.from({ length: 12 }, (_, i) => {
                    const count = boxCounts[i] ?? 0;
                    return (
                        <button
                            key={i}
                            type="button"
                            role="radio"
                            aria-checked={targetSlotType === 'box' && targetBoxNumber === i + 1}
                            title={`Box ${i + 1} (${count}/20)`}
                            className={styles.padKey}
                            {...press(
                                !ready || targetSlotType !== 'box' || count >= 20 || !contents?.boxAvailable[i],
                                () => setTargetBoxNumber(i + 1),
                            )}
                        >
                            {i + 1}
                        </button>
                    );
                })}
            </div>
        </>
    ) : (
        <DeckKey label="Connect to Lab" onClick={() => setConnectModalOpen(true)}>
            <Plug size={22} strokeWidth={2.5} aria-hidden />
        </DeckKey>
    );

    const entries = (ranch ?? []).map(ranchEntry);
    const select = (e: LabEntry) => setSelectedId(e.key);

    return (
        <>
            <LabStage
                panel={
                    <LabDeck title="Take a Pokémon" controls={controls}>
                        {!selectedPokemon && (
                            <p>Select a Pokémon from your Ranch to port into the target save.</p>
                        )}
                        {destination}
                    </LabDeck>
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
