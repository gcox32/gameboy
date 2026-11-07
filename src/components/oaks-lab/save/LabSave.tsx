'use client';

import { ReactNode, useState } from 'react';
import clsx from 'clsx';
import { SaveSlot, SlotPokemon } from '@/utils/pokemon/gen1Save';
import { GameModel } from '@/types';
import CartridgePickerModal from '@/components/modals/CartridgePicker';
import LoadStateModal from '@/components/modals/SaveStateManagement/LoadStateModal';
import ConnectModal from './ConnectModal';
import { LabEntry, MonitorScreen } from '../stage';
import { PARTY_PAGE, type LabSave } from './useLabSave';
import styles from '../lab.module.css';

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

/** The party and every box along the bottom of the screen, with the one on screen filled in */
function PageMap({ page, boxAvailable }: { page: number; boxAvailable: boolean[] }) {
    return (
        <div className={styles.pageMap} role="img" aria-label={`Showing ${pageLabel(page)} of the party and ${boxAvailable.length} boxes`}>
            <span className={clsx(styles.pageMarker, styles.pageMarkerParty, page === PARTY_PAGE && styles.pageMarkerCurrent)} />
            {boxAvailable.map((ready, box) => (
                <span
                    key={box}
                    className={clsx(styles.pageMarker, box === page && styles.pageMarkerCurrent, !ready && styles.pageMarkerUnready)}
                />
            ))}
        </div>
    );
}

interface SaveScreenHandlers {
    cursorKey: string;
    onPick: (slot: SlotPokemon) => void;
    onCursor: (slot: SlotPokemon) => void;
}

/**
 * The chosen save's party and boxes, one page at a time, as the monitor's screen shows them.
 * Comes with the Connect modal its setup screen opens, which the caller renders.
 */
export function useSaveScreen(lab: LabSave, { cursorKey, onPick, onCursor }: SaveScreenHandlers) {
    const { selectedGame, selectedSave, currentSave, contents, page } = lab;
    const [connectModalOpen, setConnectModalOpen] = useState(false);

    const slots = lab.pageSlots;
    const bySlotKey = new Map(slots.map(s => [slotKey(s), s]));
    const fromEntry = (handler: (s: SlotPokemon) => void) => (e: LabEntry) => {
        const slot = bySlotKey.get(e.key);
        if (slot) handler(slot);
    };

    let message: ReactNode = null;
    if (!selectedGame) {
        message = <p>Choose a game below to look inside its save.</p>;
    } else if (!selectedSave?.id) {
        message = <p>Choose a save file below.</p>;
    } else if (!currentSave?.connected) {
        message = (
            <>
                <p>This save isn&apos;t connected to Oak&apos;s Lab yet.</p>
                <button type="button" className={styles.screenButton} onClick={() => setConnectModalOpen(true)}>
                    Connect to Lab
                </button>
            </>
        );
    } else if (!contents && !lab.loadingSave) {
        message = <p>{lab.loadError || 'Could not read this save.'}</p>;
    }
    // The static covers the wait for the save to be read
    const loading = !message && !contents;

    const label = pageLabel(page);
    const capacity = page === PARTY_PAGE ? 6 : 20;

    const screen: MonitorScreen = {
        title: message || loading ? 'Oak’s Lab' : label,
        meta: message || loading ? undefined : `${slots.length}/${capacity}`,
        entries: slots.map(slotEntry),
        cursorKey,
        onPick: fromEntry(onPick),
        onCursor: fromEntry(onCursor),
        pages: { label, onPrev: () => lab.stepPage(-1), onNext: () => lab.stepPage(1), inactive: !contents },
        screen: message,
        loading,
        footnote: contents && page !== PARTY_PAGE
            ? <BoxesNotReadyNote boxAvailable={contents.boxAvailable} />
            : null,
        pageMap: contents && !message
            ? <PageMap page={page} boxAvailable={contents.boxAvailable} />
            : null,
    };

    const connectModal = (
        <ConnectModal
            isOpen={connectModalOpen}
            onClose={() => setConnectModalOpen(false)}
            saveStateId={selectedSave?.id ?? ''}
            gameId={selectedGame?.id ?? ''}
            fetchSaveStates={lab.fetchSaveStates}
        />
    );

    return { screen, connectModal };
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
