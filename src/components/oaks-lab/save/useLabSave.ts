'use client';

import { useState, useEffect, useCallback } from 'react';
import { SaveContents, readSaveContents, validateGen1Save } from '@/utils/pokemon/gen1Save';
import { useCurrentGame } from '@/contexts/CurrentGameContext';

/** The monitor page for the party. Boxes are pages 0–11. */
export const PARTY_PAGE = -1;

/** The current game and save, shared with Play and the Ranch, and what's in that save */
export function useLabSave() {
    const {
        game: selectedGame,
        setGame: setSelectedGame,
        save: selectedSave,
        setSave: setSelectedSave,
        saveStates,
        refreshSaves,
    } = useCurrentGame();
    const [contents, setContents] = useState<SaveContents | null>(null);
    // The file `contents` came from. Requests send it so the server can spot a stale page.
    const [loadedFilePath, setLoadedFilePath] = useState('');
    const [loadingSave, setLoadingSave] = useState(false);
    const [page, setPage] = useState(PARTY_PAGE);
    // Why the save couldn't be read, for the monitor to show
    const [loadError, setLoadError] = useState('');
    const [gamePickerOpen, setGamePickerOpen] = useState(false);
    const [savePickerOpen, setSavePickerOpen] = useState(false);

    // Already the latest copy, so it picks up a refreshed `connected` and `filePath`
    const currentSave = selectedSave;

    // The connect modal passes a game id. The list is always for the current game.
    const fetchSaveStates = useCallback(async (_gameId?: string) => { await refreshSaves(); }, [refreshSaves]);

    // A different save starts empty. The same save keeps showing until its new file arrives.
    useEffect(() => {
        setContents(null);
        setLoadedFilePath('');
        setLoadError('');
        setPage(PARTY_PAGE);
    }, [selectedSave?.id]);

    const filePath = currentSave?.filePath;
    const connected = !!currentSave?.connected;

    useEffect(() => {
        if (!selectedSave?.id || !connected || !filePath) return;
        let cancelled = false;

        const fail = (message: string) => {
            setContents(null);
            setLoadedFilePath('');
            setLoadError(message);
        };

        (async () => {
            setLoadingSave(true);
            try {
                const res = await fetch(filePath, { cache: 'no-store' });
                if (cancelled) return;
                if (!res.ok) {
                    fail(`Could not load save file (${res.status}). Check the file URL.`);
                    return;
                }
                const json = await res.json() as { MBCRam: number[] };
                if (cancelled) return;
                if (!Array.isArray(json.MBCRam)) {
                    fail('Save file is missing MBCRam data — reconnect the save state.');
                    return;
                }
                const sram = new Uint8Array(json.MBCRam);
                const invalid = validateGen1Save(sram);
                if (invalid) {
                    fail(invalid);
                    return;
                }
                const parsed = readSaveContents(sram);
                setContents(parsed);
                setLoadedFilePath(filePath);
                setLoadError('');
                setPage(p => p === PARTY_PAGE || parsed.boxAvailable[p] ? p : PARTY_PAGE);
            } catch (err) {
                if (cancelled) return;
                console.error('[useLabSave]', err);
                fail('Failed to load save file — check the console.');
            } finally {
                if (!cancelled) setLoadingSave(false);
            }
        })();

        return () => { cancelled = true; };
    }, [selectedSave?.id, connected, filePath]);

    // The party, then each box the game has set up
    const pages = contents
        ? [PARTY_PAGE, ...contents.boxAvailable.flatMap((ok, i) => ok ? [i] : [])]
        : [PARTY_PAGE];
    const pageSlots = !contents ? [] : page === PARTY_PAGE ? contents.party : contents.boxes[page] ?? [];
    const stepPage = (by: number) => {
        const at = Math.max(pages.indexOf(page), 0);
        setPage(pages[(at + by + pages.length) % pages.length]);
    };

    return {
        selectedGame,
        setSelectedGame,
        saveStates,
        selectedSave,
        setSelectedSave,
        currentSave,
        contents,
        loadedFilePath,
        loadingSave,
        page,
        setPage,
        stepPage,
        /** The Pokémon on the monitor's current page */
        pageSlots,
        /** Why the save couldn't be read, or '' */
        loadError,
        gamePickerOpen,
        setGamePickerOpen,
        savePickerOpen,
        setSavePickerOpen,
        fetchSaveStates,
        /** Re-reads the save list, which reloads the save if its file has changed */
        refresh: fetchSaveStates,
    };
}

export type LabSave = ReturnType<typeof useLabSave>;
