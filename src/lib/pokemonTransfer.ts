import mongoose from 'mongoose';
import { SaveState, StoredPokemon } from '@/models';
import type { IStoredPokemon } from '@/models/StoredPokemon';
import type { ISaveState } from '@/models/SaveState';
import { extractFromSRAM, RawExtractedPokemon } from '@/utils/pokemon/extract';
import { SaveSlot, isSlotOccupied } from '@/utils/pokemon/gen1Save';
import { clearSlot } from '@/utils/sramWriter';
import { SaveOwner, commitSave, removeBlob, uploadSave } from './saveFile';

/*
 * Moving a Pokémon changes two systems, the save file and the database, which can't be
 * updated atomically. Records carry a `transferring` marker across the gap, holding the
 * save's URL before and after the write, so if a request dies part way a later one can
 * see which side of the gap it died on. See recoverStaleTransfers.
 */

// Long enough that no live request is still running
export const STALE_TRANSFER_MS = 5 * 60 * 1000;

const CLEAR_MARKER = { $set: { status: 'stashed' as const }, $unset: { transfer: 1 as const } };

function logAfterCommit(what: string, err: unknown) {
    console.error(`[transfer] ${what} failed after the save was updated. Recovery will finish it:`, err);
}

// ─── Save → Ranch ───────────────────────────────────────────────────────────

export interface TakenFromSave {
    sram: Uint8Array;
    taken: { slot: SaveSlot; pokemon: RawExtractedPokemon }[];
}

/**
 * Removes the Pokémon from a copy of the save. Writes nothing anywhere, and throws before
 * doing anything if a slot is empty, so a bad request can't leave a partial result.
 */
export function takeFromSave(source: Uint8Array, slots: SaveSlot[]): TakenFromSave {
    if (!slots.every(s => isSlotOccupied(source, s))) {
        throw new EmptySlotError();
    }

    // High to low within each box, so clearing a slot doesn't shift the ones still to come
    const ordered = [...slots].sort((a, b) => {
        if (a.location !== b.location) return a.location === 'party' ? -1 : 1;
        if (a.boxNumber !== b.boxNumber) return (b.boxNumber ?? 0) - (a.boxNumber ?? 0);
        return b.slotIndex - a.slotIndex;
    });

    let sram = source;
    const taken: TakenFromSave['taken'] = [];
    for (const slot of ordered) {
        taken.push({ slot, pokemon: extractFromSRAM(sram, slot) });
        sram = clearSlot(sram, slot);
    }
    return { sram, taken };
}

export class EmptySlotError extends Error {
    constructor() {
        super('A selected slot is empty');
    }
}

interface SendToRanchInput {
    userId: string;
    saveState: ISaveState;
    source: Uint8Array;
    slots: SaveSlot[];
    owner: SaveOwner;
}

export type SendToRanchResult =
    | { ok: true; created: IStoredPokemon[]; updatedFilePath: string }
    | { ok: false; reason: 'save_changed' };

export async function sendToRanch(input: SendToRanchInput): Promise<SendToRanchResult> {
    const { userId, saveState, source, slots, owner } = input;
    const { sram, taken } = takeFromSave(source, slots);
    const startedAt = new Date();

    const newFilePath = await uploadSave(saveState, sram, owner);

    const docs = taken.map(({ slot, pokemon }) => new StoredPokemon({
        userId,
        sourceGameId: saveState.gameId,
        generation: 1,
        sourceSlot: slot,
        ...pokemon,
        extractedAt: startedAt,
        status: 'transferring',
        transfer: {
            direction: 'to_ranch',
            saveStateId: saveState._id,
            fromFilePath: saveState.filePath,
            toFilePath: newFilePath,
            startedAt,
        },
    }));
    const ids = docs.map(d => d._id);

    const discard = async () => {
        await StoredPokemon.deleteMany({ _id: { $in: ids } });
        await removeBlob(newFilePath);
    };

    try {
        await StoredPokemon.insertMany(docs);
    } catch (err) {
        await discard();
        throw err;
    }

    // If this throws we can't know whether it applied, so leave it for recovery.
    if (!await commitSave(saveState, newFilePath)) {
        await discard();
        return { ok: false, reason: 'save_changed' };
    }

    // From here the Pokémon have left the save, so nothing below may fail the request.
    try {
        await StoredPokemon.updateMany({ _id: { $in: ids } }, CLEAR_MARKER);
    } catch (err) {
        logAfterCommit('Marking Pokémon as stashed', err);
    }
    await removeBlob(saveState.filePath);

    const created = await StoredPokemon.find({ _id: { $in: ids } });
    return { ok: true, created, updatedFilePath: newFilePath };
}

// ─── Ranch → Save ───────────────────────────────────────────────────────────

interface PortToSaveInput {
    pokemonId: mongoose.Types.ObjectId;
    userId: string;
    saveState: ISaveState;
    patched: Uint8Array;    // the save with the Pokémon already added
    owner: SaveOwner;
}

export type PortToSaveResult =
    | { ok: true; updatedFilePath: string }
    | { ok: false; reason: 'not_stashed' | 'save_changed' };

export async function portToSave(input: PortToSaveInput): Promise<PortToSaveResult> {
    const { pokemonId, userId, saveState, patched, owner } = input;

    const newFilePath = await uploadSave(saveState, patched, owner);

    // The claim: of any number of ports of one Pokémon, only one gets past this.
    const claimed = await StoredPokemon.findOneAndUpdate(
        { _id: pokemonId, userId, status: 'stashed' },
        {
            $set: {
                status: 'transferring',
                transfer: {
                    direction: 'to_save',
                    saveStateId: saveState._id,
                    fromFilePath: saveState.filePath,
                    toFilePath: newFilePath,
                    startedAt: new Date(),
                },
            },
        },
    );
    if (!claimed) {
        await removeBlob(newFilePath);
        return { ok: false, reason: 'not_stashed' };
    }

    // If this throws we can't know whether it applied, so leave it for recovery.
    if (!await commitSave(saveState, newFilePath)) {
        await StoredPokemon.updateOne({ _id: pokemonId, status: 'transferring' }, CLEAR_MARKER);
        await removeBlob(newFilePath);
        return { ok: false, reason: 'save_changed' };
    }

    // From here the Pokémon is in the save, so nothing below may fail the request.
    try {
        await StoredPokemon.deleteOne({ _id: pokemonId });
    } catch (err) {
        logAfterCommit('Removing the Ranch record', err);
    }
    await removeBlob(saveState.filePath);

    return { ok: true, updatedFilePath: newFilePath };
}

// ─── Recovery ───────────────────────────────────────────────────────────────

export type TransferDirection = 'to_ranch' | 'to_save';

/**
 * What to do with a record whose request died. `arrived` means the save still has the
 * file this transfer wrote, `untouched` that it still has the file from before.
 *
 * If it's neither, the save has moved on and we can't tell whether the write landed. The
 * record then stays at the Ranch: a possible duplicate is better than a lost Pokémon.
 */
export function resolveStaleTransfer(
    direction: TransferDirection,
    { arrived, untouched }: { arrived: boolean; untouched: boolean },
): 'stash' | 'delete' {
    if (direction === 'to_ranch') return untouched ? 'delete' : 'stash';
    return arrived ? 'delete' : 'stash';
}

export async function recoverStaleTransfers(userId: string, now = Date.now()): Promise<void> {
    const stale = await StoredPokemon.find({
        userId,
        status: 'transferring',
        'transfer.startedAt': { $lt: new Date(now - STALE_TRANSFER_MS) },
    });

    for (const record of stale) {
        const { direction, saveStateId, fromFilePath, toFilePath, startedAt } = record.transfer!;
        const save = await SaveState.findById(saveStateId).select('filePath');
        const outcome = resolveStaleTransfer(direction, {
            arrived: save?.filePath === toFilePath,
            untouched: save?.filePath === fromFilePath,
        });

        // Matches on startedAt so this can't act on a transfer that started since the find
        const match = { _id: record._id, status: 'transferring' as const, 'transfer.startedAt': startedAt };
        if (outcome === 'delete') {
            await StoredPokemon.deleteOne(match);
        } else {
            await StoredPokemon.updateOne(match, CLEAR_MARKER);
        }
    }
}
