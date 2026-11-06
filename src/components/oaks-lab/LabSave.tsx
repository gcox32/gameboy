'use client';

import { useState } from 'react';
import Image from 'next/image';
import { pokemonGifEndpoint } from '../../../config';
import { dexDict } from '@/utils/pokemon/dicts';
import { SaveSlot, SlotPokemon } from '@/utils/pokemon/gen1Save';
import { GameModel } from '@/types';
import CartridgePickerModal from '@/components/modals/CartridgePicker';
import LoadStateModal from '@/components/modals/SaveStateManagement/LoadStateModal';
import buttons from '@/styles/buttons.module.css';
import ConnectModal from './ConnectModal';
import type { LabSave } from './useLabSave';
import styles from './styles.module.css';

export function spriteUrl(speciesIndex: number): string {
    const entry = dexDict[speciesIndex];
    if (!entry || entry.pokedexNo === 'NULL') return '';
    return `${pokemonGifEndpoint}${entry.pokedexNo.padStart(3, '0')}.gif`;
}

export const slotKey = (s: SaveSlot) =>
    s.location === 'party' ? `party-${s.slotIndex}` : `box-${s.boxNumber}-${s.slotIndex}`;

// Only the game can set up the other boxes, so say how if some aren't ready yet.
export function BoxesNotReadyNote({ boxAvailable }: { boxAvailable: boolean[] }) {
    if (boxAvailable.every(Boolean)) return null;
    const ready = boxAvailable.indexOf(true) + 1;
    return (
        <p className={styles.infoNote}>
            Only Box {ready} is ready. Change boxes once at a PC in the game and save to use the others.
        </p>
    );
}

/** The game and save buttons, the connect prompt, and the PC box buttons */
export function LabSaveSidebar({ lab }: { lab: LabSave }) {
    const { selectedGame, selectedSave, currentSave, contents, selectedBox, setSelectedBox } = lab;
    const [connectModalOpen, setConnectModalOpen] = useState(false);

    return (
        <div className={styles.sidebar}>
            <div className={styles.selectorRow}>
                <button
                    className={`${buttons.retroButton} ${styles.selectorButton}`}
                    onClick={() => lab.setGamePickerOpen(true)}
                >
                    {selectedGame?.title ?? 'choose game'}
                </button>
                <button
                    className={`${buttons.retroButton} ${styles.selectorButton}`}
                    onClick={() => lab.setSavePickerOpen(true)}
                    disabled={!selectedGame}
                >
                    {selectedSave?.title ?? 'choose save file'}
                </button>
            </div>

            {selectedSave?.id && !currentSave?.connected && (
                <div className={styles.connectBanner}>
                    <p>This save isn&apos;t connected to Oak&apos;s Lab yet.</p>
                    <button className={buttons.retroButton} onClick={() => setConnectModalOpen(true)}>
                        Connect to Lab
                    </button>
                </div>
            )}

            <ConnectModal
                isOpen={connectModalOpen}
                onClose={() => setConnectModalOpen(false)}
                saveStateId={selectedSave?.id ?? ''}
                gameId={selectedGame?.id ?? ''}
                fetchSaveStates={lab.fetchSaveStates}
            />

            {lab.showContents && contents && (
                <div className={styles.boxSection}>
                    <div className={styles.boxTitle}>PC Boxes</div>
                    <div className={styles.boxNav}>
                        {contents.boxes.map((boxSlots, i) => (
                            <button
                                key={i}
                                className={[
                                    buttons.retroButton,
                                    styles.boxNavBtn,
                                    selectedBox === i ? styles.boxNavActive : '',
                                    boxSlots.length > 0 ? styles.boxHasPokemon : '',
                                ].filter(Boolean).join(' ')}
                                onClick={() => setSelectedBox(i)}
                                disabled={!contents.boxAvailable[i]}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <BoxesNotReadyNote boxAvailable={contents.boxAvailable} />
                </div>
            )}
        </div>
    );
}

export function LabSavePickers({ lab, games }: { lab: LabSave; games: GameModel[] }) {
    const { gamePickerOpen, setGamePickerOpen, savePickerOpen, setSavePickerOpen } = lab;

    return (
        <>
            <CartridgePickerModal
                isOpen={gamePickerOpen}
                onClose={() => setGamePickerOpen(false)}
                games={games}
                onSelect={(game) => { lab.setSelectedGame(game); setGamePickerOpen(false); }}
                selectedFilePath={lab.selectedGame?.filePath}
            />
            <LoadStateModal
                isOpen={savePickerOpen}
                onClose={() => setSavePickerOpen(false)}
                saveStates={lab.saveStates}
                onConfirm={(save) => { lab.setSelectedSave(save); lab.setToast(''); setSavePickerOpen(false); }}
            />
        </>
    );
}

interface SlotGridProps {
    label: string;
    slots: SlotPokemon[];
    selectedKeys: Set<string>;
    onSelect: (slot: SlotPokemon) => void;
    showCheckbox?: boolean;
}

export function SlotGrid({ label, slots, selectedKeys, onSelect, showCheckbox }: SlotGridProps) {
    return (
        <div className={styles.boxSection}>
            <div className={styles.boxTitle}>{label}</div>
            <div className={styles.slotGrid}>
                {slots.length === 0 ? (
                    <div style={{ color: 'rgba(232,224,244,0.3)', fontSize: '0.8rem' }}>Empty</div>
                ) : slots.map(s => {
                    const key = slotKey(s);
                    const isSel = selectedKeys.has(key);
                    return (
                        <div
                            key={key}
                            className={`${styles.slotCard} ${isSel ? styles.selected : ''}`}
                            onClick={() => onSelect(s)}
                        >
                            {showCheckbox && <div className={styles.slotCardCheckbox}>{isSel ? '✓' : ''}</div>}
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
}
