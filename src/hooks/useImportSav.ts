'use client';

import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentGame } from '@/contexts/CurrentGameContext';
import { saveBlobPath } from '@/utils/blobPaths';
import { deleteBlob, uploadBlob } from '@/utils/blobUpload';
import { fetchRomHeader } from '@/utils/downloadSav';
import { normalizeSav, savTitle } from '@/utils/importSav';
import { SaveStateModel } from '@/types';

/** Largest real cartridge RAM plus a clock footer, with room to spare. Anything bigger isn't a .sav. */
const MAX_FILE_SIZE = 0x20000 + 0x100;

/**
 * Turns a `.sav` dumped from a physical cartridge into a new save for the current
 * game, stored the same way as one made in the browser. Resolves to the new save.
 */
export function useImportSav() {
    const auth = useAuth();
    const { game, refreshSaves } = useCurrentGame();
    const userId = auth?.user?.userId;
    const identity = auth?.user?.email || userId;

    return useCallback(async (file: File): Promise<SaveStateModel> => {
        if (!game?.id) throw new Error('Choose a game before importing a save.');
        if (!identity) throw new Error('Sign in to import a save.');
        if (file.size > MAX_FILE_SIZE) throw new Error("That file is too big to be a cartridge's save.");

        const bytes = new Uint8Array(await file.arrayBuffer());
        let header: Uint8Array | null = null;
        try {
            header = await fetchRomHeader(game.id);
        } catch (err) {
            console.warn("Could not read the game's ROM header, so the .sav is only checked for size:", err);
        }
        const ram = normalizeSav(bytes, header);

        const title = savTitle(file.name);
        const createRes = await fetch('/api/save-states', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId: game.id, title, description: `Imported from ${file.name}` }),
        });
        if (!createRes.ok) throw new Error('Could not create the save. Please try again.');
        const created: SaveStateModel = await createRes.json();
        const saveId = created.id!;

        let filePath = '';
        try {
            const saveFile = new File([JSON.stringify({ MBCRam: Array.from(ram) })], 'save.sav', { type: 'application/json' });
            filePath = await uploadBlob(saveFile, saveBlobPath(identity, game.title, title, saveId), { unique: true });

            const updateRes = await fetch(`/api/save-states/${saveId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath, expectedFilePath: '' }),
            });
            if (!updateRes.ok) throw new Error('Could not store the save. Please try again.');
            const saved: SaveStateModel = await updateRes.json();
            await refreshSaves();
            return saved;
        } catch (err) {
            // A save without its file can't load, so it goes rather than sitting in the list
            await fetch(`/api/save-states/${saveId}`, { method: 'DELETE' }).catch(() => {});
            if (filePath) deleteBlob(filePath).catch(() => {});
            throw err;
        }
    }, [game?.id, game?.title, identity, refreshSaves]);
}
