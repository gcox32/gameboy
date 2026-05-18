'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { pokemonGifEndpoint } from '../../../config';
import { dexDict } from '@/utils/pokemon/dicts';
import { TextEncoder as Gen1TextEncoder } from '@/utils/sramParser';
import { RanchPokemon } from '@/components/ranch/types';
import styles from './styles.module.css';

// ─── Types ─────────────────────────────────────────────────────────────────

interface GameModel { id: string; title: string }
interface SaveStateModel { id: string; title: string; filePath: string; connected: boolean; gameId: string }

interface SlotPokemon {
    location: 'party' | 'box';
    boxNumber?: number;
    slotIndex: number;
    speciesIndex: number;
    nickname: string;
    level: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function spriteUrl(speciesIndex: number): string {
    const entry = dexDict[speciesIndex];
    if (!entry || entry.pokedexNo === 'NULL') return '';
    return `${pokemonGifEndpoint}${entry.pokedexNo.padStart(3, '0')}.gif`;
}

function readUint16LE(data: number[], offset: number): number {
    return data[offset] | (data[offset + 1] << 8);
}

function parseBoxSlots(sram: number[], base: number): SlotPokemon[] {
    const count = sram[base];
    if (!count || count > 20) return [];
    const BOX_NICK = base + 22 + 20 * 33 + 20 * 11;
    const result: SlotPokemon[] = [];

    for (let i = 0; i < count; i++) {
        // Read species from the species list (base+1..base+20), not from the data block.
        // The list is the canonical occupancy indicator and terminates with 0xFF.
        const speciesIndex = sram[base + 1 + i];
        if (speciesIndex === 0xFF) break;  // hit list terminator
        if (!speciesIndex || !dexDict[speciesIndex]) continue;
        const dataOffset = base + 22 + i * 33;
        const level = sram[dataOffset + 0x03];
        if (level < 2 || level > 100) continue;
        const nickBytes = sram.slice(BOX_NICK + i * 11, BOX_NICK + i * 11 + 11);
        const nickname = Gen1TextEncoder.decodeString(nickBytes);
        result.push({ location: 'box', slotIndex: i, speciesIndex, nickname, level });
    }
    return result;
}

/*
 * Gen 1 SRAM PC box reading — layout notes
 *
 * MBCRam is a flat 32 KB array of four 8 KB SRAM banks:
 *   Bank 0  0x0000–0x1FFF  sprite tiles, Hall of Fame
 *   Bank 1  0x2000–0x3FFF  main save data, party, current-box buffer
 *   Bank 2  0x4000–0x5FFF  PC boxes 1–6
 *   Bank 3  0x6000–0x7FFF  PC boxes 7–12
 *
 * Party (bank 1, 0x2F2C):
 *   [0]        count (0–6)
 *   [1–7]      species list + 0xFF terminator
 *   [8 + i*44] 44-byte Pokémon data per slot; level at data+0x21
 *   [8 + 6*44 + i*11]         OT names (11 bytes each)
 *   [8 + 6*44 + 6*11 + i*11]  nicknames (11 bytes each)
 *
 * PC boxes (bank 2/3, BOX_SIZE = 0x462 bytes each):
 *   [0]         count (0–20)
 *   [1–21]      species list (20 slots + 0xFF terminator)
 *   [22 + i*33] 33-byte box Pokémon data per slot; level at data+0x03
 *   [22 + 20*33 + i*11]         OT names
 *   [22 + 20*33 + 20*11 + i*11] nicknames
 *
 * Current-box double-buffer:
 *   wCurrentBoxNum (0x284C) — lower nibble = 0-indexed box number (0–11);
 *     upper bits are flags (0x80 = currently in PC) and must be masked off.
 *   The active box's live data is always in the buffer at 0x30C0 (one full box,
 *   0x462 bytes). Its banked slot is stale until the player switches boxes or saves.
 *   All other boxes are read directly from their banked slots.
 */
function parseSaveFile(data: Uint8Array): { party: SlotPokemon[]; boxes: SlotPokemon[][] } {
    const sram = Array.from(data);
    const PARTY_BASE = 0x2F2C;
    const partyCount = sram[PARTY_BASE];
    const PARTY_DATA = PARTY_BASE + 8;
    const PARTY_NICK = PARTY_BASE + 8 + 6 * 44 + 6 * 11;

    const party: SlotPokemon[] = [];
    for (let i = 0; i < Math.min(partyCount, 6); i++) {
        const dataOffset = PARTY_DATA + i * 44;
        const speciesIndex = sram[dataOffset];
        if (!speciesIndex || speciesIndex === 0xFF) continue;
        const level = sram[dataOffset + 0x21];
        const nickBytes = sram.slice(PARTY_NICK + i * 11, PARTY_NICK + i * 11 + 11);
        const nickname = Gen1TextEncoder.decodeString(nickBytes);
        party.push({ location: 'party', slotIndex: i, speciesIndex, nickname, level });
    }

    const CURRENT_BOX_BASE = 0x30C0;
    const currentBoxIdx = sram[0x284C] & 0x0F;

    const BOX_SIZE = 0x462;
    const boxes: SlotPokemon[][] = [];
    for (let b = 0; b < 12; b++) {
        const bankBase = b < 6 ? 0x4000 : 0x6000;
        const boxIdx = b < 6 ? b : b - 6;
        const base = b === currentBoxIdx ? CURRENT_BOX_BASE : bankBase + boxIdx * BOX_SIZE;
        const boxPokemon = parseBoxSlots(sram, base).map(p => ({
            ...p,
            location: 'box' as const,
            boxNumber: b + 1,
        }));
        boxes.push(boxPokemon);
    }

    return { party, boxes };
}

// ─── Tab 1: Extract ──────────────────────────────────────────────────────────

function ExtractTab({ games }: { games: GameModel[] }) {
    const [gameId, setGameId] = useState('');
    const [saveStates, setSaveStates] = useState<SaveStateModel[]>([]);
    const [saveStateId, setSaveStateId] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);
    const [party, setParty] = useState<SlotPokemon[]>([]);
    const [boxes, setBoxes] = useState<SlotPokemon[][]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState('');
    const [selectedBox, setSelectedBox] = useState(0);
    const [connectError, setConnectError] = useState('');

    const currentSave = saveStates.find(s => s.id === saveStateId);

    const fetchSaveStates = useCallback(async (gId: string) => {
        if (!gId) { setSaveStates([]); return; }
        const res = await fetch(`/api/save-states?gameId=${gId}`);
        const data = await res.json();
        setSaveStates(data);
    }, []);

    useEffect(() => { fetchSaveStates(gameId); setSaveStateId(''); }, [gameId, fetchSaveStates]);

    const loadSaveFile = useCallback(async (overrideUrl?: string) => {
        const url = overrideUrl ?? currentSave?.filePath;
        if (!url) return;
        setLoadingSave(true);
        setParty([]); setBoxes([]); setSelected(new Set()); setSelectedBox(0);
        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) {
                setToast(`Could not load save file (${res.status}). Check the file URL.`);
                return;
            }
            const json = await res.json() as { MBCRam: number[] };
            if (!Array.isArray(json.MBCRam)) {
                setToast('Save file is missing MBCRam data — reconnect the save state.');
                return;
            }
            const parsed = parseSaveFile(new Uint8Array(json.MBCRam));
            setParty(parsed.party);
            setBoxes(parsed.boxes);
        } catch (err) {
            console.error('[loadSaveFile]', err);
            setToast('Failed to load save file — check the console.');
        } finally {
            setLoadingSave(false);
        }
    }, [currentSave?.filePath]);

    useEffect(() => {
        if (saveStateId && currentSave?.connected) loadSaveFile();
    }, [saveStateId, currentSave?.connected, loadSaveFile]);

    const handleConnect = async () => {
        if (!saveStateId) return;
        setConnecting(true);
        setConnectError('');
        try {
            const res = await fetch(`/api/save-states/${saveStateId}/connect`, { method: 'POST' });
            if (res.ok) {
                // Re-fetch from DB so connected:true and the updated filePath are reflected.
                // saveStateId is preserved, so currentSave updates, which triggers the
                // useEffect that calls loadSaveFile.
                await fetchSaveStates(gameId);
            } else {
                const body = await res.json().catch(() => ({}));
                const msg = body?.error ?? `Server error (${res.status})`;
                setConnectError(msg);
                console.error('[connect]', res.status, body);
            }
        } catch (err) {
            setConnectError('Network error — check the console.');
            console.error('[connect] fetch failed:', err);
        } finally {
            setConnecting(false);
        }
    };

    const slotKey = (s: SlotPokemon) =>
        s.location === 'party' ? `party-${s.slotIndex}` : `box-${s.boxNumber}-${s.slotIndex}`;

    const toggleSlot = (s: SlotPokemon) => {
        const key = slotKey(s);
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const handleSend = async () => {
        if (!selected.size) return;
        setSending(true);
        const allSlots = [
            ...party,
            ...boxes.flat(),
        ].filter(s => selected.has(slotKey(s)));

        const slots = allSlots.map(s => ({
            location: s.location,
            ...(s.location === 'box' ? { boxNumber: s.boxNumber } : {}),
            slotIndex: s.slotIndex,
        }));

        const res = await fetch('/api/pokemon/stored', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ saveStateId, slots }),
        });

        if (res.ok) {
            const { created, updatedFilePath } = await res.json();
            setToast(`${created.length} Pokémon sent to the Ranch!`);
            await Promise.all([
                fetchSaveStates(gameId),
                loadSaveFile(updatedFilePath),
            ]);
        } else {
            setToast('Something went wrong.');
        }
        setSending(false);
        setTimeout(() => setToast(''), 4000);
    };

    const renderSlotGrid = (slots: SlotPokemon[], label: string) => (
        <div className={styles.boxSection}>
            <div className={styles.boxTitle}>{label}</div>
            <div className={styles.slotGrid}>
                {slots.length === 0 ? (
                    <div style={{ color: 'rgba(232,224,244,0.3)', fontSize: '0.8rem' }}>Empty</div>
                ) : slots.map(s => {
                    const key = slotKey(s);
                    const isSel = selected.has(key);
                    return (
                        <div
                            key={key}
                            className={`${styles.slotCard} ${isSel ? styles.selected : ''}`}
                            onClick={() => toggleSlot(s)}
                        >
                            <div className={styles.slotCardCheckbox}>{isSel ? '✓' : ''}</div>
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
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className={styles.twoCol}>
            <div className={styles.sidebar}>
                <div className={styles.selectorRow}>
                    <select className={styles.select} value={gameId} onChange={e => setGameId(e.target.value)}>
                        <option value="">Select a game...</option>
                        {games.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                    </select>
                    <select className={styles.select} value={saveStateId} onChange={e => setSaveStateId(e.target.value)} disabled={!gameId}>
                        <option value="">Select a save state...</option>
                        {saveStates.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                </div>

                {saveStateId && !currentSave?.connected && (
                    <div className={styles.connectBanner}>
                        <p>This save is not connected to Oak&apos;s Lab. Connect it to enable transfers and stamp your Trainer ID.</p>
                        {connectError && <p style={{ color: '#e05555' }}>{connectError}</p>}
                        <button className={styles.btnPrimary} onClick={handleConnect} disabled={connecting}>
                            {connecting ? 'Connecting...' : 'Connect to Lab'}
                        </button>
                    </div>
                )}

                {currentSave?.connected && !loadingSave && (party.length > 0 || boxes.some(b => b.length > 0)) && (
                    <div className={styles.boxSection}>
                        <div className={styles.boxTitle}>PC Boxes</div>
                        <div className={styles.boxNav}>
                            {boxes.map((boxSlots, i) => (
                                <button
                                    key={i}
                                    className={[
                                        styles.boxNavBtn,
                                        selectedBox === i ? styles.boxNavActive : '',
                                        boxSlots.length > 0 ? styles.boxHasPokemon : '',
                                    ].join(' ')}
                                    onClick={() => setSelectedBox(i)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.content}>
                {selected.size > 0 && (
                    <div className={styles.sendBar}>
                        <p>{selected.size} Pokémon selected</p>
                        <button className={styles.btnPrimary} onClick={handleSend} disabled={sending}>
                            {sending ? 'Sending...' : 'Send to Ranch'}
                        </button>
                    </div>
                )}

                {toast && <p style={{ color: '#c8a0f0', marginBottom: '1rem' }}>{toast}</p>}
                {loadingSave && <p style={{ color: 'rgba(232,224,244,0.5)' }}>Loading save file...</p>}

                {currentSave?.connected && !loadingSave && (party.length > 0 || boxes.some(b => b.length > 0)) && (
                    <>
                        {renderSlotGrid(party, 'Party')}
                        {renderSlotGrid(boxes[selectedBox] ?? [], `Box ${selectedBox + 1}`)}
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Tab 2: Port-in ──────────────────────────────────────────────────────────

function PortInTab({ games }: { games: GameModel[] }) {
    const [gameId, setGameId] = useState('');
    const [saveStates, setSaveStates] = useState<SaveStateModel[]>([]);
    const [saveStateId, setSaveStateId] = useState('');
    const [ranch, setRanch] = useState<RanchPokemon[]>([]);
    const [selectedPokemon, setSelectedPokemon] = useState<RanchPokemon | null>(null);
    const [targetSlotType, setTargetSlotType] = useState<'party' | 'box'>('party');
    const [targetBoxNumber, setTargetBoxNumber] = useState(1);
    const [occupancy, setOccupancy] = useState<{ partyCount: number; boxCounts: number[] } | null>(null);
    const [porting, setPorting] = useState(false);
    const [toast, setToast] = useState('');
    const [portedSave, setPortedSave] = useState<{ party: SlotPokemon[]; boxes: SlotPokemon[][] } | null>(null);

    const currentSave = saveStates.find(s => s.id === saveStateId);

    const fetchSaveStates = useCallback(async (gId: string) => {
        if (!gId) { setSaveStates([]); return; }
        const res = await fetch(`/api/save-states?gameId=${gId}`);
        setSaveStates(await res.json());
    }, []);

    const fetchRanch = useCallback(async () => {
        try {
            const data = await fetch('/api/pokemon/stored?status=stashed').then(r => r.json());
            setRanch(data);
        } catch {}
    }, []);

    useEffect(() => { fetchSaveStates(gameId); setSaveStateId(''); }, [gameId, fetchSaveStates]);
    useEffect(() => { fetchRanch(); }, [fetchRanch]);

    useEffect(() => {
        if (!saveStateId || !currentSave?.connected || !currentSave.filePath) {
            setOccupancy(null);
            return;
        }
        fetch(currentSave.filePath, { cache: 'no-store' })
            .then(r => r.json())
            .then((json: { MBCRam: number[] }) => {
                if (!Array.isArray(json.MBCRam)) return;
                const parsed = parseSaveFile(new Uint8Array(json.MBCRam));
                setOccupancy({ partyCount: parsed.party.length, boxCounts: parsed.boxes.map(b => b.length) });
            })
            .catch(() => {});
    }, [saveStateId, currentSave?.connected, currentSave?.filePath]);

    const handlePort = async () => {
        if (!selectedPokemon || !saveStateId) return;
        setPorting(true);
        setPortedSave(null);
        const targetSlot = targetSlotType === 'party'
            ? { location: 'party', slotIndex: 0 }
            : { location: 'box', boxNumber: targetBoxNumber, slotIndex: 0 };

        const res = await fetch(`/api/pokemon/stored/${selectedPokemon.id}/port`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetSaveStateId: saveStateId, targetSlot }),
        });

        if (res.ok) {
            const { updatedFilePath } = await res.json() as { updatedFilePath: string };
            setToast(`${selectedPokemon.nickname} sent to ${currentSave?.title ?? 'your game'}!`);
            setSelectedPokemon(null);
            await Promise.all([fetchRanch(), fetchSaveStates(gameId)]);
            try {
                const saveRes = await fetch(updatedFilePath, { cache: 'no-store' });
                const saveJson = await saveRes.json() as { MBCRam: number[] };
                if (Array.isArray(saveJson.MBCRam)) {
                    const fresh = parseSaveFile(new Uint8Array(saveJson.MBCRam));
                    setPortedSave(fresh);
                    setOccupancy({ partyCount: fresh.party.length, boxCounts: fresh.boxes.map(b => b.length) });
                }
            } catch {}
        } else {
            const err = await res.json().catch(() => ({}));
            setToast(err.error ?? 'Something went wrong.');
        }
        setPorting(false);
        setTimeout(() => setToast(''), 4000);
    };

    return (
        <div className={styles.twoCol}>
            <div className={styles.sidebar}>
                <div className={styles.selectorRow}>
                    <select className={styles.select} value={gameId} onChange={e => setGameId(e.target.value)}>
                        <option value="">Select target game...</option>
                        {games.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                    </select>
                    <select className={styles.select} value={saveStateId} onChange={e => setSaveStateId(e.target.value)} disabled={!gameId}>
                        <option value="">Select save state...</option>
                        {saveStates.map(s => <option key={s.id} value={s.id}>{s.title}{!s.connected ? ' (not connected)' : ''}</option>)}
                    </select>
                </div>

                {saveStateId && !currentSave?.connected && (
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
                                        className={`${styles.slotPickerBtn} ${targetSlotType === loc ? styles.pickerActive : ''}`}
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
                                    return (
                                        <button
                                            key={i}
                                            className={`${styles.slotPickerBtn} ${targetBoxNumber === i + 1 ? styles.pickerActive : ''}`}
                                            onClick={() => setTargetBoxNumber(i + 1)}
                                            disabled={full}
                                        >
                                            {`Box ${i + 1}${occupancy ? ` (${count}/20)` : ''}`}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {selectedPokemon && saveStateId && currentSave?.connected && (() => {
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
                            <button className={styles.btnPrimary} onClick={handlePort} disabled={porting || isFull}>
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
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OaksLab() {
    const [tab, setTab] = useState<'extract' | 'port'>('extract');
    const [games, setGames] = useState<GameModel[]>([]);

    useEffect(() => {
        fetch('/api/games')
            .then(r => r.json())
            .then(setGames)
            .catch(() => {});
    }, []);

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
                        className={`${styles.tab} ${tab === 'extract' ? styles.active : ''}`}
                        onClick={() => setTab('extract')}
                    >
                        Leave a Pokémon
                    </button>
                    <button
                        className={`${styles.tab} ${tab === 'port' ? styles.active : ''}`}
                        onClick={() => setTab('port')}
                    >
                        Take a Pokémon
                    </button>
                </div>

                {tab === 'extract' ? <ExtractTab games={games} /> : <PortInTab games={games} />}
            </div>
        </div>
    );
}
