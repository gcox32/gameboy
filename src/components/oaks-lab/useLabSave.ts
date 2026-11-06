'use client';

import { useState, useEffect, useCallback } from 'react';
import { SaveContents, readSaveContents, validateGen1Save } from '@/utils/pokemon/gen1Save';
import { GameModel, SaveStateModel } from '@/types';

/** Choosing a game and save in the Lab, and reading what's in that save */
export function useLabSave() {
    const [selectedGame, setSelectedGame] = useState<GameModel | null>(null);
    const [saveStates, setSaveStates] = useState<SaveStateModel[]>([]);
    const [selectedSave, setSelectedSave] = useState<SaveStateModel | null>(null);
    const [contents, setContents] = useState<SaveContents | null>(null);
    // The file `contents` came from. Requests send it so the server can spot a stale page.
    const [loadedFilePath, setLoadedFilePath] = useState('');
    const [loadingSave, setLoadingSave] = useState(false);
    const [selectedBox, setSelectedBox] = useState(0);
    const [toast, setToast] = useState('');
    const [gamePickerOpen, setGamePickerOpen] = useState(false);
    const [savePickerOpen, setSavePickerOpen] = useState(false);

    // Re-derive to pick up the refreshed `connected` and `filePath` after fetching
    const currentSave = saveStates.find(s => s.id === selectedSave?.id) ?? selectedSave;
    const gameId = selectedGame?.id ?? '';

    const fetchSaveStates = useCallback(async (gId: string) => {
        if (!gId) { setSaveStates([]); return; }
        const res = await fetch(`/api/save-states?gameId=${gId}`);
        setSaveStates(await res.json());
    }, []);

    useEffect(() => { fetchSaveStates(gameId); setSelectedSave(null); }, [gameId, fetchSaveStates]);

    // A different save starts empty. The same save keeps showing until its new file arrives.
    useEffect(() => {
        setContents(null);
        setLoadedFilePath('');
        setSelectedBox(0);
    }, [selectedSave?.id]);

    const filePath = currentSave?.filePath;
    const connected = !!currentSave?.connected;

    useEffect(() => {
        if (!selectedSave?.id || !connected || !filePath) return;
        let cancelled = false;

        const fail = (message: string) => {
            setContents(null);
            setLoadedFilePath('');
            setToast(message);
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
                setSelectedBox(box => parsed.boxAvailable[box] ? box : Math.max(parsed.boxAvailable.indexOf(true), 0));
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

    const showContents = connected && !!contents
        && (contents.party.length > 0 || contents.boxes.some(b => b.length > 0));

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
        selectedBox,
        setSelectedBox,
        showContents,
        toast,
        setToast,
        gamePickerOpen,
        setGamePickerOpen,
        savePickerOpen,
        setSavePickerOpen,
        fetchSaveStates,
        /** Re-reads the save list, which reloads the save if its file has changed */
        refresh: useCallback(() => fetchSaveStates(gameId), [fetchSaveStates, gameId]),
    };
}

export type LabSave = ReturnType<typeof useLabSave>;
