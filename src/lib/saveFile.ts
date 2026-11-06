import { del, put } from '@vercel/blob';
import { SaveState } from '@/models';
import type { ISaveState } from '@/models/SaveState';
import type { IGame } from '@/models/Game';
import { validateGen1Save } from '@/utils/pokemon/gen1Save';
import { saveBlobPath } from '@/utils/blobPaths';

// An object so tests can replace blob storage
export const blobStore = { put, del };

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

export const SAVE_CHANGED_MESSAGE = 'This save changed since it was loaded. Check it and try again.';

export interface SaveOwner {
    identity: string;       // the user's email, or id if they have none
    gameTitle: string;
}

/**
 * Writing a save takes three steps, so a caller can do its own work in between:
 * uploadSave, then commitSave, then removeBlob on whichever file is no longer in use.
 */
export async function uploadSave(saveState: ISaveState, sram: Uint8Array, owner: SaveOwner): Promise<string> {
    const blobPath = saveBlobPath(owner.identity, owner.gameTitle, saveState.title ?? 'save', String(saveState._id));
    const body = Buffer.from(JSON.stringify({ MBCRam: Array.from(sram) }));
    const blob = await blobStore.put(blobPath, body, { access: 'public', addRandomSuffix: true });
    return blob.url;
}

/**
 * Points the record at the uploaded file, only if it still has the file `saveState` was
 * read with. Every write gets a unique URL, so this is the version check: it returns
 * false if anything else wrote to the save first, and the caller's upload is then stale.
 */
export async function commitSave(
    saveState: ISaveState,
    newFilePath: string,
    alsoSet?: Partial<Pick<ISaveState, 'connected'>>,
): Promise<boolean> {
    const result = await SaveState.updateOne(
        { _id: saveState._id, filePath: saveState.filePath },
        { $set: { filePath: newFilePath, ...alsoSet } },
    );
    return result.matchedCount === 1;
}

interface SaveRecordFields {
    title?: string;
    description?: string;
    filePath?: string;
    img?: string;
}

/**
 * Applies an edit from the client. A change of file only applies if the record still has
 * the file the client was working from, the same check as commitSave. Returns the updated
 * record, or null if the save has changed since.
 */
export async function updateSaveRecord(
    saveState: ISaveState,
    fields: SaveRecordFields,
    expectedFilePath?: string,
): Promise<ISaveState | null> {
    const changingFile = fields.filePath !== undefined && fields.filePath !== saveState.filePath;
    const set = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
    return SaveState.findOneAndUpdate(
        changingFile ? { _id: saveState._id, filePath: expectedFilePath } : { _id: saveState._id },
        { $set: set },
        { new: true, runValidators: true },
    );
}

// Non-fatal: the worst case is one orphaned blob.
export async function removeBlob(url: string): Promise<void> {
    try { await blobStore.del(url); } catch { /* see above */ }
}
