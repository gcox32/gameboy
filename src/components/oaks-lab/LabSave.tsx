'use client';

import { ReactNode, useState } from 'react';
import { SaveSlot, SlotPokemon } from '@/utils/pokemon/gen1Save';
import { GameModel } from '@/types';
import CartridgePickerModal from '@/components/modals/CartridgePicker';
import LoadStateModal from '@/components/modals/SaveStateManagement/LoadStateModal';
import ConnectModal from './ConnectModal';
import { LabEntry, Monitor } from './LabStage';
import { PARTY_PAGE, type LabSave } from './useLabSave';
import styles from './lab.module.css';

export { spriteUrl } from './sprite';

export const slotKey = (s: SaveSlot) =>
    s.location === 'party' ? `party-${s.slotIndex}` : `box-${s.boxNumber}-${s.slotIndex}`;

export const slotEntry = (s: SlotPokemon): LabEntry => ({
    key: slotKey(s),
    speciesIndex: s.speciesIndex,
    nickname: s.nickname,
    level: s.level,
});

// Only the game can set up the other boxes, so say how if some aren't ready yet.
export function BoxesNotReadyNote({ boxAvailable, className }: { boxAvailable: boolean[]; className?: string }) {
    if (boxAvailable.every(Boolean)) return null;
    const ready = boxAvailable.indexOf(true) + 1;
    return (
        <p className={className}>
            Only Box {ready} is ready. Change boxes once at a PC in the game and save to use the others.
        </p>
    );
}

export const pageLabel = (page: number) => page === PARTY_PAGE ? 'Party' : `Box ${page + 1}`;

interface SaveMonitorProps {
    lab: LabSave;
    cursorKey: string;
    markedKeys?: Set<string>;
    onPick: (slot: SlotPokemon) => void;
    onCursor: (slot: SlotPokemon) => void;
    action?: { label: string; onClick: () => void; inactive?: boolean };
}

/** The monitor showing the chosen save's party and boxes, one page at a time */
export function SaveMonitor({ lab, cursorKey, markedKeys, onPick, onCursor, action }: SaveMonitorProps) {
    const { selectedGame, selectedSave, currentSave, contents, page } = lab;
    const [connectModalOpen, setConnectModalOpen] = useState(false);

    const slots = lab.pageSlots;
    const bySlotKey = new Map(slots.map(s => [slotKey(s), s]));
    const fromEntry = (handler: (s: SlotPokemon) => void) => (e: LabEntry) => {
        const slot = bySlotKey.get(e.key);
        if (slot) handler(slot);
    };

    let screen: ReactNode = null;
    if (!selectedGame) {
        screen = <p>Choose a game below to look inside its save.</p>;
    } else if (!selectedSave?.id) {
        screen = <p>Choose a save file below.</p>;
    } else if (!currentSave?.connected) {
        screen = (
            <>
                <p>This save isn&apos;t connected to Oak&apos;s Lab yet.</p>
                <button type="button" className={styles.screenButton} onClick={() => setConnectModalOpen(true)}>
                    Connect to Lab
                </button>
            </>
        );
    } else if (!contents) {
        screen = <p className={lab.loadingSave ? styles.blink : undefined}>
            {lab.loadingSave ? 'Loading save file...' : 'Could not read this save.'}
        </p>;
    }

    const label = pageLabel(page);
    const capacity = page === PARTY_PAGE ? 6 : 20;

    return (
        <>
            <Monitor
                title={screen ? 'Oak’s Lab' : label}
                meta={screen ? undefined : `${slots.length}/${capacity}`}
                entries={slots.map(slotEntry)}
                cursorKey={cursorKey}
                markedKeys={markedKeys}
                onPick={fromEntry(onPick)}
                onCursor={fromEntry(onCursor)}
                pages={{ label, onPrev: () => lab.stepPage(-1), onNext: () => lab.stepPage(1), inactive: !contents }}
                action={action}
                screen={screen}
                footnote={contents && page !== PARTY_PAGE
                    ? <BoxesNotReadyNote boxAvailable={contents.boxAvailable} />
                    : null}
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
                onConfirm={(save) => { lab.setSelectedSave(save); setSavePickerOpen(false); }}
            />
        </>
    );
}
