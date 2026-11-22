import { Game, Notification, Profile, RanchPen, SaveState, StoredPokemon, User } from '@/models';
import type { IGame } from '@/models/Game';
import type { ISaveState } from '@/models/SaveState';
import { ownsBlobUrl } from './blob';
import { blobStore } from './saveFile';

/*
 * Deleting a record also deletes the files it points to, here on the server so no client can
 * leave them behind. Records go first: if a file delete then fails, the worst case is an
 * orphaned file, never a record whose file is gone.
 */

interface Owner {
    id: string;
    email?: string | null;
}

async function ownerOf(userId: unknown): Promise<Owner> {
    const user = await User.findById(userId).select('email').lean();
    return { id: String(userId), email: user?.email };
}

/**
 * Deletes the files among `urls` that are in the owner's own folders. Anything else, such as a
 * preset cover from the app's assets, is left alone. Returns how many were deleted.
 */
export async function deleteOwnedFiles(urls: (string | null | undefined)[], owner: Owner): Promise<number> {
    const owned = [...new Set(urls.filter((u): u is string => !!u && ownsBlobUrl(u, owner)))];
    const results = await Promise.allSettled(owned.map((url) => blobStore.del(url)));
    results.forEach((r, i) => {
        if (r.status === 'rejected') console.error(`[userFiles] Couldn't delete ${owned[i]}:`, r.reason);
    });
    return results.filter((r) => r.status === 'fulfilled').length;
}

const saveFiles = (save: Pick<ISaveState, 'filePath' | 'img'>) => [save.filePath, save.img];

/** Deletes a save and its file and screenshot. */
export async function deleteSave(save: ISaveState): Promise<void> {
    await SaveState.deleteOne({ _id: save._id });
    await deleteOwnedFiles(saveFiles(save), await ownerOf(save.userId));
}

/**
 * Deletes a game, every save of it, and their files: the ROM, its cover, and each save's file
 * and screenshot. Pokémon that left the game for the Ranch are kept; they hold their own data.
 */
export async function deleteGame(game: IGame): Promise<{ saves: number; files: number }> {
    const saves = await SaveState.find({ gameId: game._id }).select('filePath img').lean();

    await SaveState.deleteMany({ gameId: game._id });
    await Game.deleteOne({ _id: game._id });

    const files = await deleteOwnedFiles(
        [game.filePath, game.img, ...saves.flatMap(saveFiles)],
        await ownerOf(game.userId),
    );
    return { saves: saves.length, files };
}

/**
 * Deletes a user and everything they own: games, saves, Ranch Pokémon and pens, notifications,
 * their reads of broadcasts, and the files behind all of it. The profile goes last, so if
 * anything fails partway the user is still listed in the admin view and the delete can be retried.
 */
export async function deleteUser(userId: string): Promise<{ games: number; saves: number; pokemon: number; files: number }> {
    const owner = await ownerOf(userId);
    const [profile, games, saves] = await Promise.all([
        Profile.findOne({ userId }).select('avatar').lean(),
        Game.find({ userId }).select('filePath img').lean(),
        // By user, not by game, so saves whose game is already gone are caught too
        SaveState.find({ userId }).select('filePath img').lean(),
    ]);

    await SaveState.deleteMany({ userId });
    await Game.deleteMany({ userId });
    const { deletedCount: pokemon } = await StoredPokemon.deleteMany({ userId });
    await RanchPen.deleteMany({ userId });
    await Notification.deleteMany({ userId });
    await Notification.updateMany({ userId: 'BROADCAST' }, { $pull: { readBy: { userId } } });
    await User.deleteOne({ _id: userId });
    await Profile.deleteOne({ userId });

    const files = await deleteOwnedFiles(
        [profile?.avatar, ...games.flatMap((g) => [g.filePath, g.img]), ...saves.flatMap(saveFiles)],
        owner,
    );
    return { games: games.length, saves: saves.length, pokemon, files };
}
