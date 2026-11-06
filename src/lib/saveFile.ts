import { del, put } from '@vercel/blob';
import { SaveState } from '@/models';
import type { ISaveState } from '@/models/SaveState';
import type { IGame } from '@/models/Game';
import { validateGen1Save } from '@/utils/pokemon/gen1Save';
import { saveBlobPath } from '@/utils/blobPaths';

export type LoadedSave =
    | { sram: Uint8Array; error?: undefined; status?: undefined }
    | { sram?: undefined; error: string; status: number };

/**
 * Fetches a save's file and confirms it's a Gen 1 save that's safe to write to.
 * Every Lab route loads through here, before changing anything.
 */
export async function loadGen1Save(saveState: ISaveState, game: IGame | null): Promise<LoadedSave> {
    const generation = game?.metadata?.generation;
    if (generation && generation !== 1) {
        return { error: "Oak's Lab only works with Gen 1 Pokémon games.", status: 422 };
    }
    if (!saveState.filePath) {
        return { error: "This save has no file yet. Save from the game's menu, then save it here.", status: 422 };
    }

    const res = await fetch(saveState.filePath, { cache: 'no-store' });
    if (!res.ok) return { error: 'Failed to fetch save file', status: 502 };

    let json: { MBCRam?: unknown };
    try {
        json = await res.json();
    } catch {
        return { error: 'Save file could not be read', status: 502 };
    }
    if (!Array.isArray(json.MBCRam)) return { error: 'Save file is missing MBCRam data', status: 502 };

    const sram = new Uint8Array(json.MBCRam);
    const invalid = validateGen1Save(sram);
    if (invalid) return { error: invalid, status: 422 };

    return { sram };
}

interface StoreOptions {
    identity: string;       // the user's email, or id if they have none
    gameTitle: string;
    alsoSet?: Partial<Pick<ISaveState, 'connected'>>;
}

/**
 * Uploads a patched save, points the record at it, then removes the old file. Each write
 * gets a new URL, so the old file stays intact if the upload fails. Returns the new URL.
 */
export async function storeSave(saveState: ISaveState, sram: Uint8Array, options: StoreOptions): Promise<string> {
    const { identity, gameTitle, alsoSet } = options;
    const oldFilePath = saveState.filePath;
    const blobPath = saveBlobPath(identity, gameTitle, saveState.title ?? 'save', String(saveState._id));
    const patched = Buffer.from(JSON.stringify({ MBCRam: Array.from(sram) }));
    const blob = await put(blobPath, patched, { access: 'public', addRandomSuffix: true });

    await SaveState.updateOne({ _id: saveState._id }, { $set: { filePath: blob.url, ...alsoSet } });
    try { await del(oldFilePath); } catch { /* non-fatal: at most one orphaned blob */ }

    return blob.url;
}
