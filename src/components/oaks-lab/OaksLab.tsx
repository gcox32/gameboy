'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { SaveContents, SlotPokemon, readSaveContents, validateGen1Save } from '@/utils/pokemon/gen1Save';
import { RanchPokemon } from '@/components/ranch/types';
import { GameModel, SaveStateModel } from '@/types';
import { useGames } from '@/contexts/GamesContext';
import styles from './styles.module.css';
import buttons from '@/styles/buttons.module.css';
import EditTab from './EditTab';
import { BoxesNotReadyNote, LabSavePickers, LabSaveSidebar, SlotGrid, slotKey, spriteUrl } from './LabSave';
import { useLabSave } from './useLabSave';
import CartridgePickerModal from '@/components/modals/CartridgePicker';
import LoadStateModal from '@/components/modals/SaveStateManagement/LoadStateModal';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Occupancy {
    partyCount: number;
    boxCounts: number[];
    boxAvailable: boolean[];
}

// ─── Tab 1: Extract ──────────────────────────────────────────────────────────

function ExtractTab({ games }: { games: GameModel[] }) {
    const lab = useLabSave();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [sending, setSending] = useState(false);
    const { contents, loadedFilePath, refresh, setToast } = lab;
    const party = contents?.party ?? [];

    // Slots only mean something in the file they were read from.
    useEffect(() => { setSelected(new Set()); }, [loadedFilePath]);

    const toggleSlot = (s: SlotPokemon) => {
        const key = slotKey(s);
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const emptiesParty = party.length > 0 && party.every(s => selected.has(slotKey(s)));

    const handleSend = async () => {
        if (!selected.size || emptiesParty || !contents) return;
        setSending(true);
        const slots = [...contents.party, ...contents.boxes.flat()]
            .filter(s => selected.has(slotKey(s)))
            .map(s => ({
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
                setToast(`${created.length} Pokémon sent to the Ranch!`);
            } else {
                const err = await res.json().catch(() => ({}));
                setToast(err.error ?? 'Something went wrong.');
            }
            // On success this shows the new file. On a conflict, whatever is there now.
            await refresh();
        } catch {
            setToast('Something went wrong. Check your connection and try again.');
        } finally {
            setSending(false);
            setTimeout(() => setToast(''), 4000);
        }
    };

    return (
        <div className={styles.twoCol}>
            <LabSaveSidebar lab={lab} />

            <div className={styles.content}>
                {selected.size > 0 && (
                    <div className={styles.sendBar}>
                        <p>
                            {emptiesParty
                                ? 'At least one Pokémon must stay in your party'
                                : `${selected.size} Pokémon selected`}
                        </p>
                        <button
                            className={buttons.retroButton}
                            onClick={handleSend}
                            disabled={sending || emptiesParty}
                        >
                            {sending ? 'Sending...' : 'Send to Ranch'}
                        </button>
                    </div>
                )}

                {lab.toast && <p style={{ color: '#c8a0f0', marginBottom: '1rem' }}>{lab.toast}</p>}
                {lab.loadingSave && <p style={{ color: 'rgba(232,224,244,0.5)' }}>Loading save file...</p>}

                {lab.showContents && !lab.loadingSave && (
                    <>
                        <SlotGrid
                            label="Party"
                            slots={party}
                            selectedKeys={selected}
                            onSelect={toggleSlot}
                            showCheckbox
                        />
                        <SlotGrid
                            label={`Box ${lab.selectedBox + 1}`}
                            slots={contents?.boxes[lab.selectedBox] ?? []}
                            selectedKeys={selected}
                            onSelect={toggleSlot}
                            showCheckbox
                        />
                    </>
                )}
            </div>

            <LabSavePickers lab={lab} games={games} />
        </div>
    );
}

// ─── Tab 2: Port-in ──────────────────────────────────────────────────────────

function PortInTab({ games }: { games: GameModel[] }) {
    const [selectedGame, setSelectedGame] = useState<GameModel | null>(null);
    const [saveStates, setSaveStates] = useState<SaveStateModel[]>([]);
    const [selectedSave, setSelectedSave] = useState<SaveStateModel | null>(null);
    const [gamePickerOpen, setGamePickerOpen] = useState(false);
    const [savePickerOpen, setSavePickerOpen] = useState(false);
    const [ranch, setRanch] = useState<RanchPokemon[]>([]);
    const [selectedPokemon, setSelectedPokemon] = useState<RanchPokemon | null>(null);
    const [targetSlotType, setTargetSlotType] = useState<'party' | 'box'>('party');
    const [targetBoxNumber, setTargetBoxNumber] = useState(1);
    const [occupancy, setOccupancy] = useState<Occupancy | null>(null);
    const [porting, setPorting] = useState(false);
    const [toast, setToast] = useState('');
    const [portedSave, setPortedSave] = useState<SaveContents | null>(null);

    // Re-derive to pick up refreshed `connected` status after fetchSaveStates
    const currentSave = saveStates.find(s => s.id === selectedSave?.id) ?? selectedSave;

    const fetchSaveStates = useCallback(async (gId: string) => {
        if (!gId) { setSaveStates([]); return; }
        const res = await fetch(`/api/save-states?gameId=${gId}`);
        setSaveStates(await res.json());
    }, []);

    const applyContents = useCallback((contents: SaveContents) => {
        setOccupancy({
            partyCount: contents.party.length,
            boxCounts: contents.boxes.map(b => b.length),
            boxAvailable: contents.boxAvailable,
        });
        // Don't leave a box selected that this save can't use.
        setTargetBoxNumber(prev => contents.boxAvailable[prev - 1] ? prev : contents.boxAvailable.indexOf(true) + 1);
    }, []);

    const fetchRanch = useCallback(async () => {
        try {
            const data = await fetch('/api/pokemon/stored').then(r => r.json());
            setRanch(data);
        } catch {}
    }, []);

    useEffect(() => { fetchSaveStates(selectedGame?.id ?? ''); setSelectedSave(null); }, [selectedGame?.id, fetchSaveStates]);
    useEffect(() => { fetchRanch(); }, [fetchRanch]);

    useEffect(() => {
        if (!selectedSave?.id || !currentSave?.connected || !currentSave.filePath) {
            setOccupancy(null);
            return;
        }
        fetch(currentSave.filePath, { cache: 'no-store' })
            .then(r => r.json())
            .then((json: { MBCRam: number[] }) => {
                if (!Array.isArray(json.MBCRam)) return;
                const sram = new Uint8Array(json.MBCRam);
                const invalid = validateGen1Save(sram);
                if (invalid) {
                    setOccupancy(null);
                    setToast(invalid);
                    return;
                }
                applyContents(readSaveContents(sram));
            })
            .catch(() => {});
    }, [selectedSave?.id, currentSave?.connected, currentSave?.filePath, applyContents]);

    const handlePort = async () => {
        if (!selectedPokemon || !selectedSave?.id) return;
        setPorting(true);
        setPortedSave(null);
        const targetSlot = targetSlotType === 'party'
            ? { location: 'party', slotIndex: 0 }
            : { location: 'box', boxNumber: targetBoxNumber, slotIndex: 0 };

        const res = await fetch(`/api/pokemon/stored/${selectedPokemon.id}/port`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetSaveStateId: selectedSave.id, targetSlot }),
        });

        if (res.ok) {
            const { updatedFilePath } = await res.json() as { updatedFilePath: string };
            setToast(`${selectedPokemon.nickname} sent to ${currentSave?.title ?? 'your game'}!`);
            setSelectedPokemon(null);
            await Promise.all([fetchRanch(), fetchSaveStates(selectedGame?.id ?? '')]);
            try {
                const saveRes = await fetch(updatedFilePath, { cache: 'no-store' });
                const saveJson = await saveRes.json() as { MBCRam: number[] };
                if (Array.isArray(saveJson.MBCRam)) {
                    const fresh = readSaveContents(new Uint8Array(saveJson.MBCRam));
                    setPortedSave(fresh);
                    applyContents(fresh);
                }
            } catch {}
        } else {
            const err = await res.json().catch(() => ({}));
            setToast(err.error ?? 'Something went wrong.');
            // Either side may have moved on, so show what's there now.
            setSelectedPokemon(null);
            await Promise.all([fetchRanch(), fetchSaveStates(selectedGame?.id ?? '')]);
        }
        setPorting(false);
        setTimeout(() => setToast(''), 4000);
    };

    return (
        <div className={styles.twoCol}>
            <div className={styles.sidebar}>
                <div className={styles.selectorRow}>
                    <button
                        className={`${buttons.retroButton} ${styles.selectorButton}`}
                        onClick={() => setGamePickerOpen(true)}
                    >
                        {selectedGame?.title ?? 'choose game'}
                    </button>
                    <button
                        className={`${buttons.retroButton} ${styles.selectorButton}`}
                        onClick={() => setSavePickerOpen(true)}
                        disabled={!selectedGame}
                    >
                        {selectedSave?.title ?? 'choose save file'}
                    </button>
                </div>

                {selectedSave?.id && !currentSave?.connected && (
                    <div className={styles.connectBanner}>
                        <p>This save is not connected to Oak&apos;s Lab. Connect it first to receive Pokémon.</p>
                    </div>
                )}

                {selectedPokemon && (
                    <div className={styles.boxSection}>
                        <div className={styles.boxTitle}>Target Slot</div>
                        <div className={styles.slotPicker}>
                            {(['party', 'box'] as const).map(loc => {
                                const full = loc === 'party'
                                    ? (occupancy?.partyCount ?? 0) >= 6
                                    : false;
                                return (
                                    <button
                                        key={loc}
                                        className={[
                                            buttons.retroButton,
                                            styles.slotPickerBtn,
                                            targetSlotType === loc ? styles.pickerActive : '',
                                        ].filter(Boolean).join(' ')}
                                        onClick={() => setTargetSlotType(loc)}
                                        disabled={full}
                                    >
                                        {loc === 'party'
                                            ? `Party${occupancy ? ` (${occupancy.partyCount}/6)` : ''}`
                                            : 'PC Box'}
                                    </button>
                                );
                            })}
                        </div>

                        {targetSlotType === 'box' && (
                            <div className={styles.slotPicker}>
                                {Array.from({ length: 12 }, (_, i) => {
                                    const count = occupancy?.boxCounts[i] ?? 0;
                                    const full = count >= 20;
                                    const available = occupancy?.boxAvailable[i] ?? true;
                                    return (
                                        <button
                                            key={i}
                                            className={[
                                                buttons.retroButton,
                                                styles.slotPickerBtn,
                                                targetBoxNumber === i + 1 ? styles.pickerActive : '',
                                            ].filter(Boolean).join(' ')}
                                            onClick={() => setTargetBoxNumber(i + 1)}
                                            disabled={full || !available}
                                        >
                                            {`Box ${i + 1}${occupancy ? ` (${count}/20)` : ''}`}
                                        </button>
                                    );
                                })}
                                {occupancy && <BoxesNotReadyNote boxAvailable={occupancy.boxAvailable} />}
                            </div>
                        )}
                    </div>
                )}

                {selectedPokemon && selectedSave?.id && currentSave?.connected && (() => {
                    const nextSlot = targetSlotType === 'party'
                        ? `Party — slot ${(occupancy?.partyCount ?? 0) + 1}`
                        : `Box ${targetBoxNumber} — slot ${(occupancy?.boxCounts[targetBoxNumber - 1] ?? 0) + 1}`;
                    const isFull = targetSlotType === 'party'
                        ? (occupancy?.partyCount ?? 0) >= 6
                        : (occupancy?.boxCounts[targetBoxNumber - 1] ?? 0) >= 20;
                    return (
                        <div className={styles.sendBar}>
                            <p>
                                Send <strong>{selectedPokemon.nickname}</strong> to {nextSlot}
                            </p>
                            <button
                                className={buttons.retroButton}
                                onClick={handlePort}
                                disabled={porting || isFull}
                            >
                                {porting ? 'Sending...' : isFull ? 'Full' : `Send to ${currentSave?.title ?? 'Game'}`}
                            </button>
                        </div>
                    );
                })()}
            </div>

            <div className={styles.content}>
                <p className={styles.infoNote}>Select a Pokémon from your Ranch to port into the target save.</p>

                {ranch.length === 0 ? (
                    <p style={{ color: 'rgba(232,224,244,0.4)', fontSize: '0.9rem' }}>No Pokémon at the Ranch.</p>
                ) : (
                    <div className={styles.ranchGrid}>
                        {ranch.map(p => (
                            <div
                                key={p.id}
                                className={`${styles.ranchCard} ${selectedPokemon?.id === p.id ? styles.selectedRanch : ''}`}
                                onClick={() => setSelectedPokemon(prev => prev?.id === p.id ? null : p)}
                            >
                                {spriteUrl(p.speciesIndex) && (
                                    <Image
                                        src={spriteUrl(p.speciesIndex)}
                                        alt={p.nickname}
                                        width={64}
                                        height={64}
                                        className={styles.slotSprite}
                                        unoptimized
                                    />
                                )}
                                <div className={styles.slotName}>{p.nickname}</div>
                                <div className={styles.slotLevel}>Lv. {p.level}</div>
                            </div>
                        ))}
                    </div>
                )}

                {toast && <p style={{ color: '#c8a0f0', marginBottom: '1rem' }}>{toast}</p>}

                {portedSave && (
                    <div className={styles.boxSection}>
                        <div className={styles.boxTitle}>
                            {currentSave?.title ?? 'Target save'} — current state
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(232,224,244,0.5)', marginBottom: '0.5rem' }}>
                            Party: {portedSave.party.length} · Boxes: {portedSave.boxes.reduce((n, b) => n + b.length, 0)} total
                        </div>
                        <div className={styles.slotGrid}>
                            {[...portedSave.party, ...portedSave.boxes.flat()].map(s => (
                                <div key={`${s.location}-${s.boxNumber ?? 'p'}-${s.slotIndex}`} className={styles.slotCard}>
                                    {spriteUrl(s.speciesIndex) && (
                                        <Image
                                            src={spriteUrl(s.speciesIndex)}
                                            alt={s.nickname}
                                            width={56}
                                            height={56}
                                            className={styles.slotSprite}
                                            unoptimized
                                        />
                                    )}
                                    <div className={styles.slotName}>{s.nickname}</div>
                                    <div className={styles.slotLevel}>Lv. {s.level}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <CartridgePickerModal
                isOpen={gamePickerOpen}
                onClose={() => setGamePickerOpen(false)}
                games={games}
                onSelect={(game) => { setSelectedGame(game); setGamePickerOpen(false); }}
                selectedFilePath={selectedGame?.filePath}
            />
            <LoadStateModal
                isOpen={savePickerOpen}
                onClose={() => setSavePickerOpen(false)}
                saveStates={saveStates}
                onConfirm={(save) => { setSelectedSave(save); setToast(''); setSavePickerOpen(false); }}
            />
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OaksLab() {
    const [tab, setTab] = useState<'extract' | 'port' | 'edit'>('extract');
    const { games } = useGames();

    return (
        <div className={styles.page}>
            <div className={styles.hero}>
                <Image
                    src="/images/oaks_lab.jpg"
                    alt="Oak's Lab"
                    fill
                    className={styles.heroImg}
                    priority
                    unoptimized
                />
                <div className={styles.heroOverlay} />
            </div>

            <div className={styles.main}>
                <div className={styles.pageHeader}>
                    <h1>Oak&apos;s Lab</h1>
                    <p>Transfer Pokémon between your save files</p>
                </div>
                <div className={styles.tabs}>
                    <button
                        className={`${buttons.retroButton} ${styles.tab} ${tab === 'extract' ? styles.tabActive : ''}`}
                        onClick={() => setTab('extract')}
                    >
                        Leave a Pokémon
                    </button>
                    <button
                        className={`${buttons.retroButton} ${styles.tab} ${tab === 'port' ? styles.tabActive : ''}`}
                        onClick={() => setTab('port')}
                    >
                        Take a Pokémon
                    </button>
                    <button
                        className={`${buttons.retroButton} ${styles.tab} ${tab === 'edit' ? styles.tabActive : ''}`}
                        onClick={() => setTab('edit')}
                    >
                        Enhance a Pokémon
                    </button>
                </div>

                {tab === 'extract' && <ExtractTab games={games} />}
                {tab === 'port' && <PortInTab games={games} />}
                {tab === 'edit' && <EditTab games={games} />}
            </div>
        </div>
    );
}
