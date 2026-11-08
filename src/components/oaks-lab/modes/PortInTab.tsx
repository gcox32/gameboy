'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowUpFromLine, Plug } from 'lucide-react';
import { RanchPokemon } from '@/components/ranch/types';
import ConnectModal from '../save/ConnectModal';
import { DeckKey, DeckPill, LabDeck, LabEntry, LabResult, SlideSwitch, press, useFeedStage } from '../stage';
import { BoxesNotReadyNote } from '../save/LabSave';
import type { LabSave } from '../save/useLabSave';
import styles from '../lab.module.css';

const ranchEntry = (p: RanchPokemon): LabEntry => ({
    key: p.id,
    speciesIndex: p.speciesIndex,
    nickname: p.nickname,
    level: p.level,
});

/** Take a Pokémon: send a Pokémon from the Ranch into a save */
export default function PortInTab({ lab }: { lab: LabSave }) {
    const { selectedGame, selectedSave, currentSave, contents } = lab;
    const [ranch, setRanch] = useState<RanchPokemon[] | null>(null);
    const [selectedId, setSelectedId] = useState('');
    const [targetSlotType, setTargetSlotType] = useState<'party' | 'box'>('party');
    const [targetBoxNumber, setTargetBoxNumber] = useState(1);
    const [porting, setPorting] = useState(false);
    const [connectModalOpen, setConnectModalOpen] = useState(false);
    // How the last send went, until it's acknowledged
    const [result, setResult] = useState<LabResult | null>(null);

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
        setResult(null);
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
                setResult({ tone: 'success', text: `${selectedPokemon.nickname} sent to ${currentSave?.title ?? 'your game'}!` });
            } else {
                const err = await res.json().catch(() => ({}));
                setResult({ tone: 'error', text: err.error ?? 'Something went wrong.' });
            }
            // Either way, show what's there now. A new file reloads the save's contents.
            setSelectedId('');
            await Promise.all([fetchRanch(), lab.refresh()]);
        } catch {
            setResult({ tone: 'error', text: 'Something went wrong. Check your connection and try again.' });
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
        destination = <p>This save is not connected to Oak&apos;s Lab. Press the plug key to connect it, then it can receive Pokémon.</p>;
    } else if (!contents) {
        destination = <p className={lab.loadingSave ? styles.blink : undefined}>
            {lab.loadingSave ? 'Loading save file...' : lab.loadError || 'Could not read this save.'}
        </p>;
    } else {
        destination = (
            <>
                <p className={styles.deckHint}>
                    {targetSlotType === 'party'
                        ? `Party (${partyCount}/6)`
                        : `Box ${targetBoxNumber} (${boxCounts[targetBoxNumber - 1] ?? 0}/20)`}
                </p>
                {/* The switch goes wherever it's put, so a full destination is explained here */}
                {isFull ? (
                    <p className={styles.deckWarn}>
                        {targetSlotType === 'party'
                            ? 'The party is full. Switch to PC Box to send a Pokémon to a box instead.'
                            : `Box ${targetBoxNumber} is full. Choose another box.`}
                    </p>
                ) : selectedPokemon && (
                    <p>Send <strong>{selectedPokemon.nickname}</strong> to {nextSlot}</p>
                )}
                {targetSlotType === 'box' && (
                    <BoxesNotReadyNote boxAvailable={contents.boxAvailable} className={styles.deckHint} />
                )}
            </>
        );
    }

    // The same hardware whether or not the save is connected. Connect only works when it isn't.
    const controls = (
        <>
            <SlideSwitch
                small
                label="Target slot"
                options={[
                    { id: 'party', label: `Party (${partyCount}/6)` },
                    { id: 'box', label: 'PC Box' },
                ]}
                value={targetSlotType}
                onChange={setTargetSlotType}
            />
            <div className={styles.deckKeys}>
                <DeckPill
                    label="Connect to Lab"
                    onClick={() => setConnectModalOpen(true)}
                    inactive={!selectedSave?.id || connected}
                >
                    <Plug size={18} aria-hidden />
                </DeckPill>
                <DeckKey
                    label={porting ? 'Sending...' : `Send to ${currentSave?.title ?? 'Game'}`}
                    onClick={handlePort}
                    inactive={!ready || !selectedPokemon || porting || isFull}
                >
                    <ArrowUpFromLine size={22} strokeWidth={2.5} aria-hidden />
                </DeckKey>
            </div>
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
    );

    const entries = (ranch ?? []).map(ranchEntry);
    const select = (e: LabEntry) => {
        setSelectedId(e.key);
        setResult(null);
    };

    // The Ranch on the monitor, and the chosen Pokémon on the pad. Take has nothing to show from a save.
    useFeedStage({
        screens: {
            ranch: {
                title: 'Ranch',
                meta: ranch ? `${ranch.length}` : undefined,
                entries,
                cursorKey: selectedId,
                onPick: e => {
                    setSelectedId(prev => prev === e.key ? '' : e.key);
                    setResult(null);
                },
                onCursor: select,
                loading: ranch === null,
                emptyText: 'No Pokémon at the Ranch.',
            },
        },
        platform: selectedPokemon ? ranchEntry(selectedPokemon) : null,
    });

    return (
        <>
            <LabDeck
                title="Take a Pokémon"
                controls={controls}
                busy={porting ? 'Sending...' : undefined}
                result={result}
                onDismissResult={() => setResult(null)}
            >
                {!selectedPokemon && (
                    <p>Select a Pokémon from your Ranch to port into the target save.</p>
                )}
                {destination}
            </LabDeck>
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
