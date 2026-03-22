import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { uploadBlob } from '@/utils/blobUpload';
import { GameModel, SaveStateModel } from '@/types';

interface GameInstance {
    saveSRAMState: () => number[];
}

export const useSaveState = (gameInstance: GameInstance, currentGame: GameModel, userId: string) => {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const saveThisState = async (saveData: SaveStateModel, isUpdate: boolean): Promise<SaveStateModel> => {
        setIsSaving(true);
        setError(null);

        try {
            const MBCRam = gameInstance.saveSRAMState();
            if (MBCRam.length === 0) throw new Error('No save data available');

            const saveStateId = (isUpdate && saveData.id) ? saveData.id : uuidv4();
            const gameId = currentGame.id;

            if (!userId) throw new Error('Cannot save: user ID is missing');
            if (!gameId) throw new Error('Cannot save: game ID is missing');

            // Upload save file
            const safeTitle = (saveData.title || 'save').replace(/\//g, '-').trim() || 'save';
            const saveBlob = new Blob([JSON.stringify({ MBCRam })], { type: 'application/json' });
            const saveFile = new File([saveBlob], `${safeTitle}.sav`, { type: 'application/json' });
            const savePath = `save-states/${userId}/${gameId}/${saveStateId}/${safeTitle}.sav`;

            // For updates, we re-upload to the same path (Vercel Blob overwrites)
            const filePath = await uploadBlob(saveFile, savePath);

            // Upload screenshot if provided
            let imgPath = saveData.img || '';
            if (saveData.imgFile && saveData.imgFile.type.startsWith('image/')) {
                const ext = saveData.imgFile.name.split('.').pop() ?? 'png';
                const screenshotPath = `save-states/${userId}/${gameId}/${saveStateId}/screenshot.${ext.replace(/\//g, '')}`;
                imgPath = await uploadBlob(saveData.imgFile, screenshotPath);
            }

            // Persist to DB
            const method = isUpdate ? 'PUT' : 'POST';
            const url = isUpdate ? `/api/save-states/${saveStateId}` : '/api/save-states';
            const body = isUpdate
                ? { filePath, img: imgPath }
                : {
                    gameId,
                    title: saveData.title,
                    description: saveData.description || '',
                    filePath,
                    img: imgPath,
                };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error('Failed to save state to database');

            const saved: SaveStateModel = await res.json();
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
