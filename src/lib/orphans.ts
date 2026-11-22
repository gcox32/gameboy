import { Game, Profile, SaveState, StoredPokemon, User } from '@/models';
import { sanitizeEmail } from '@/utils/blobPaths';
import { USER_FOLDER_NAMES, listUserFolderFiles, type StoreListing, type StoredFile } from './blob';
import { blobStore } from './saveFile';

/*
 * Orphaned files: files in the user folders that no record points to, left behind by a delete
 * or replace that didn't finish. And the reverse, records pointing at files that are gone.
 *
 * Every write uploads the file first and points a record at it after, so a file only a few
 * moments old can have no record yet. Files younger than GRACE_MS are never called orphans.
 */

export const GRACE_MS = 24 * 60 * 60 * 1000;

type Store = StoreListing['store'];

/** A record's pointer to a file */
export interface FileReference {
    url: string;
    /** What the file is to the record */
    kind: 'rom' | 'cover' | 'save' | 'screenshot' | 'avatar' | 'transfer';
    /** The record's own label, e.g. a game's title */
    label: string;
    userId: string;
}

export interface Orphan extends StoredFile {
    store: Store;
    folder: string;
    /** The account whose folder it's in, if that account still exists */
    ownerId?: string;
    ownerEmail?: string;
}

export interface OrphanReport {
    stores: { store: Store; error?: string; files: number }[];
    orphans: Orphan[];
    /** Unreferenced files too new to call orphans yet */
    recent: number;
    /** Records pointing at a file that isn't in its store */
    missing: (FileReference & { store: Store })[];
}

/** One key per file, whatever the URL's query string or encoding */
export function fileKey(url: string): string | null {
    try {
        const u = new URL(url);
        return `${u.hostname.toLowerCase()}${decodeURIComponent(u.pathname)}`;
    } catch {
        return null;
    }
}

function storeOf(url: string): Store | null {
    try {
        const host = new URL(url).hostname;
        if (host.endsWith('.private.blob.vercel-storage.com')) return 'private';
        if (host.endsWith('.public.blob.vercel-storage.com')) return 'public';
    } catch { /* not a URL */ }
    return null;
}

const inUserFolder = (pathname: string) => USER_FOLDER_NAMES.some((f) => pathname.startsWith(`${f}/`));

/** Every file a record points to */
export async function referencedFiles(): Promise<FileReference[]> {
    const [games, saves, profiles, moving] = await Promise.all([
        Game.find().select('userId title filePath img').lean(),
        SaveState.find().select('userId title filePath img').lean(),
        Profile.find({ avatar: { $nin: [null, ''] } }).select('userId username avatar').lean(),
        // Mid-move, both the save's old file and its new one are in use
        StoredPokemon.find({ transfer: { $exists: true } }).select('userId speciesName transfer').lean(),
    ]);

    const refs: FileReference[] = [];
    const add = (url: string | null | undefined, kind: FileReference['kind'], label: string, userId: unknown) => {
        if (url) refs.push({ url, kind, label, userId: String(userId) });
    };
    for (const g of games) { add(g.filePath, 'rom', g.title, g.userId); add(g.img, 'cover', g.title, g.userId); }
    for (const s of saves) { add(s.filePath, 'save', s.title, s.userId); add(s.img, 'screenshot', s.title, s.userId); }
    for (const p of profiles) add(p.avatar, 'avatar', p.username, p.userId);
    for (const m of moving) {
        add(m.transfer?.fromFilePath, 'transfer', m.speciesName, m.userId);
        add(m.transfer?.toFilePath, 'transfer', m.speciesName, m.userId);
    }
    return refs;
}

/** Matches a folder name (an email slug or, in older paths, a user id) to its account */
export type OwnerLookup = Map<string, { id: string; email: string }>;

async function ownerLookup(): Promise<OwnerLookup> {
    const users = await User.find().select('email').lean();
    const lookup: OwnerLookup = new Map();
    for (const u of users) {
        const owner = { id: String(u._id), email: u.email };
        lookup.set(String(u._id), owner);
        lookup.set(sanitizeEmail(u.email), owner);
    }
    return lookup;
}

/** Sorts listed files into referenced, orphaned and too new to say, and finds records whose file is gone */
export function classify(
    listings: StoreListing[],
    references: FileReference[],
    owners: OwnerLookup,
    { now = Date.now(), graceMs = GRACE_MS }: { now?: number; graceMs?: number } = {},
): OrphanReport {
    const referenced = new Set(references.map((r) => fileKey(r.url)).filter((k): k is string => !!k));
    const listed = new Set<string>();
    const orphans: Orphan[] = [];
    let recent = 0;

    for (const { store, error, files } of listings) {
        if (error) continue;
        for (const file of files) {
            const key = fileKey(file.url);
            if (!key) continue;
            listed.add(key);
            if (referenced.has(key)) continue;
            if (now - file.uploadedAt.getTime() < graceMs) { recent++; continue; }

            const segments = file.pathname.split('/');
            const owner = segments.slice(1, -1).map((s) => owners.get(s)).find(Boolean);
            orphans.push({ ...file, store, folder: segments[0], ownerId: owner?.id, ownerEmail: owner?.email });
        }
    }

    // Only claim a file is missing if its store was listed, and it's somewhere a listing covers
    const listedStores = new Set(listings.filter((l) => !l.error).map((l) => l.store));
    const missing: OrphanReport['missing'] = [];
    for (const ref of references) {
        const store = storeOf(ref.url);
        const key = fileKey(ref.url);
        if (!store || !key || !listedStores.has(store)) continue;
        const pathname = key.slice(key.indexOf('/') + 1);
        if (inUserFolder(pathname) && !listed.has(key)) missing.push({ ...ref, store });
    }

    return {
        stores: listings.map((l) => ({ store: l.store, error: l.error, files: l.files.length })),
        orphans: orphans.sort((a, b) => b.size - a.size),
        recent,
        missing,
    };
}

type Lister = () => Promise<StoreListing[]>;

export async function findOrphans(list: Lister = listUserFolderFiles): Promise<OrphanReport> {
    const [listings, references, owners] = await Promise.all([list(), referencedFiles(), ownerLookup()]);
    return classify(listings, references, owners);
}

/**
 * Deletes the given files, but only those still orphaned now: it checks again rather than
 * trusting the list it was given, which may be stale or not from a scan at all.
 */
export async function deleteOrphans(urls: string[], list: Lister = listUserFolderFiles): Promise<{
    deleted: { url: string; size: number }[];
    skipped: { url: string; reason: string }[];
}> {
    const { orphans } = await findOrphans(list);
    const orphanByKey = new Map(orphans.map((o) => [fileKey(o.url), o]));

    const deleted: { url: string; size: number }[] = [];
    const skipped: { url: string; reason: string }[] = [];
    for (const url of new Set(urls)) {
        const orphan = orphanByKey.get(fileKey(url));
        if (!orphan) {
            skipped.push({ url, reason: 'No longer an orphan, or not found' });
            continue;
        }
        try {
            await blobStore.del(orphan.url);
            deleted.push({ url: orphan.url, size: orphan.size });
        } catch (err) {
            skipped.push({ url, reason: (err as Error).message || 'Delete failed' });
        }
    }
    return { deleted, skipped };
}
