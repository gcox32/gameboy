import mongoose, { HydratedDocument } from 'mongoose';
import { RanchPen, StoredPokemon } from '@/models';
import type { IRanchPen } from '@/models/RanchPen';

type PenDoc = HydratedDocument<IRanchPen>;

/** Most Pokémon a pen holds. The corral's open grass gets crowded past this. */
export const PEN_CAPACITY = 20;
/** Most pens a user can make by hand. Arrivals still get a new pen past this, so none is homeless. */
export const MAX_PENS = 24;
export const PEN_NAME_MAX = 20;

const isDuplicateKey = (err: unknown) =>
    typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;

/** The first "Pen N" name not already taken */
function nextPenName(pens: Pick<IRanchPen, 'name'>[]): string {
    const taken = new Set(pens.map(p => p.name.toLowerCase()));
    let n = 1;
    while (taken.has(`pen ${n}`)) n++;
    return `Pen ${n}`;
}

/**
 * Adds a pen after the user's last one. Keyed on (user, order), so two requests that race
 * to add the same pen both get the one pen.
 */
export async function addPen(userId: string, pens: PenDoc[], name?: string): Promise<PenDoc> {
    const order = pens.length ? Math.max(...pens.map(p => p.order)) + 1 : 0;
    const filter = { userId, order };
    try {
        const pen = await RanchPen.findOneAndUpdate(
            filter,
            { $setOnInsert: { name: name || nextPenName(pens) } },
            { upsert: true, returnDocument: 'after' },
        );
        return pen!;
    } catch (err) {
        if (!isDuplicateKey(err)) throw err;
        return (await RanchPen.findOne(filter))!;
    }
}

/** Pokémon that count against a pen's room: those there now, and any mid-move */
export function penOccupants(userId: string, penId: mongoose.Types.ObjectId | string) {
    return StoredPokemon.countDocuments({ userId, penId });
}

/**
 * Gives every Pokémon at the Ranch a pen, and returns the user's pens in order.
 *
 * New arrivals come in from the Lab with no pen, and a Pokémon can lose its pen if that pen
 * goes. Each one settles into the first pen with room, oldest arrivals first, and a new pen
 * is opened when every pen is full. A user with no pens yet gets their first one here.
 */
export async function settleRanch(userId: string): Promise<PenDoc[]> {
    const pens = await RanchPen.find({ userId }).sort({ order: 1 });
    if (pens.length === 0) pens.push(await addPen(userId, pens));

    const penIds = pens.map(p => p._id);
    const homeless = await StoredPokemon.find(
        { userId, status: 'stashed', $or: [{ penId: null }, { penId: { $nin: penIds } }] },
        { _id: 1 },
    ).sort({ extractedAt: 1 });
    if (homeless.length === 0) return pens;

    const counts = new Map<string, number>();
    const occupied = await StoredPokemon.aggregate<{ _id: mongoose.Types.ObjectId; n: number }>([
        { $match: { userId: new mongoose.Types.ObjectId(userId), penId: { $in: penIds } } },
        { $group: { _id: '$penId', n: { $sum: 1 } } },
    ]);
    for (const { _id, n } of occupied) counts.set(_id.toString(), n);

    const moves = new Map<string, mongoose.Types.ObjectId[]>();
    let i = 0;
    for (const mon of homeless) {
        while (i < pens.length && (counts.get(pens[i].id) ?? 0) >= PEN_CAPACITY) i++;
        if (i === pens.length) pens.push(await addPen(userId, pens));
        const pen = pens[i];
        counts.set(pen.id, (counts.get(pen.id) ?? 0) + 1);
        moves.set(pen.id, [...(moves.get(pen.id) ?? []), mon._id as mongoose.Types.ObjectId]);
    }

    // Conditional on still being homeless, so a move made meanwhile isn't undone
    await Promise.all([...moves].map(([penId, ids]) =>
        StoredPokemon.updateMany(
            { _id: { $in: ids }, status: 'stashed', $or: [{ penId: null }, { penId: { $nin: penIds } }] },
            { $set: { penId } },
        )));

    return pens;
}

export function penJSON(pen: PenDoc) {
    return { id: pen._id.toString(), name: pen.name, order: pen.order };
}
