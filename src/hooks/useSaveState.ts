'use client';

import { useState } from 'react';
import { uploadBlob, deleteBlob } from '@/utils/blobUpload';
import { saveBlobPath } from '@/utils/blobPaths';
import { GameModel, SaveStateModel } from '@/types';

interface GameInstance {
    saveSRAMState: () => number[];
}

export const useSaveState = (gameInstance: GameInstance, currentGame: GameModel, userId: string, userEmail: string) => {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const saveThisState = async (saveData: SaveStateModel, isUpdate: boolean): Promise<SaveStateModel> => {
        setIsSaving(true);
        setError(null);

        try {
            const MBCRam = gameInstance.saveSRAMState();
            if (MBCRam.length === 0) throw new Error('No save data available');

            const gameId = currentGame.id;
            if (!userId) throw new Error('Cannot save: user ID is missing');
            if (!gameId) throw new Error('Cannot save: game ID is missing');

            // For creates, register the record first to get the MongoDB ID.
            // For updates, the existing ID is used directly.
            let saveStateId: string;
            if (isUpdate && saveData.id) {
                saveStateId = saveData.id;
            } else {
                const createRes = await fetch('/api/save-states', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        gameId,
                        title: saveData.title,
                        description: saveData.description || '',
                        img: saveData.img || '',
                    }),
                });
                if (!createRes.ok) throw new Error('Failed to create save state record');
                const created: SaveStateModel = await createRes.json();
                saveStateId = created.id!;
            }

            const identity = userEmail || userId;
            const saveFile = new File(
                [JSON.stringify({ MBCRam })],
                'save.sav',
                { type: 'application/json' },
            );
            const savePath = saveBlobPath(identity, currentGame.title, saveData.title ?? 'save', saveStateId);
            const oldFilePath = isUpdate ? saveData.filePath : '';
            const filePath = await uploadBlob(saveFile, savePath);

            // Upload screenshot if provided
            let imgPath = saveData.img || '';
            if (saveData.imgFile && saveData.imgFile.type.startsWith('image/')) {
                const ext = saveData.imgFile.name.split('.').pop() ?? 'png';
                const screenshotPath = savePath.replace('/save.sav', `/screenshot.${ext.replace(/\//g, '')}`);
                imgPath = await uploadBlob(saveData.imgFile, screenshotPath);
            }

            // Update the record with the blob URL (and img if changed)
            const updateRes = await fetch(`/api/save-states/${saveStateId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath, img: imgPath }),
            });
            if (!updateRes.ok) throw new Error('Failed to update save state record');
            const saved: SaveStateModel = await updateRes.json();

            // Delete old blob if the URL changed (title rename or first-ever upload)
            if (oldFilePath && oldFilePath !== filePath) {
                deleteBlob(oldFilePath).catch(() => {});
            }

            return saved;
        } catch (err) {
            const e = err instanceof Error ? err : new Error('An unknown error occurred');
            setError(e);
            throw e;
        } finally {
            setIsSaving(false);
        }
    };

    return { saveThisState, isSaving, error };
};
