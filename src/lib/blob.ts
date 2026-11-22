import { del, get, put } from '@vercel/blob';
import { sanitizeEmail } from '@/utils/blobPaths';

/**
 * What users upload (ROMs, saves, screenshots, covers, avatars) belongs in the private Blob store,
 * read back through /api/blob/file, which checks the reader owns it. Blob access is fixed per store,
 * so the private store has its own credentials. Files from before it existed are still in the public
 * store, and both kinds of URL keep working until scripts/migrate-blobs-private.mjs has moved them.
 *
 * The private store is reached with its read-write token if there is one, or else with its store id
 * and Vercel's OIDC token. Deployments always have OIDC; locally it takes VERCEL_OIDC_TOKEN from
 * `vercel env pull`. Without one the SDK would quietly fall back to the public store's token, so
 * locally that counts as not configured.
 */
const PRIVATE_TOKEN = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN || undefined;
const PRIVATE_STORE_ID = process.env.PRIVATE_BLOB_STORE_ID || undefined;
const HAS_OIDC = process.env.VERCEL === '1' || !!process.env.VERCEL_OIDC_TOKEN;

/** Credentials for the private store, or null if it isn't usable here. */
function privateAuth(): { token: string } | { storeId: string } | null {
    if (PRIVATE_TOKEN) return { token: PRIVATE_TOKEN };
    if (PRIVATE_STORE_ID && HAS_OIDC) return { storeId: PRIVATE_STORE_ID };
    return null;
}

let warned = false;

export function isPrivateBlobUrl(url: string): boolean {
    try {
        return new URL(url).hostname.endsWith('.private.blob.vercel-storage.com');
    } catch {
        return false;
    }
}

function isBlobUrl(url: URL): boolean {
    return url.protocol === 'https:'
        && (url.hostname.endsWith('.private.blob.vercel-storage.com') || url.hostname.endsWith('.public.blob.vercel-storage.com'));
}

/** The top-level folders users upload into, and so the only ones they can read or delete. */
const USER_FOLDERS = new Set(['games', 'saves', 'avatars']);

/**
 * Whether a user owns the file at a blob path. User files live at `{folder}/{email or id}/…`,
 * and some older ones hold the user id deeper in the path. Only the path is checked, never the
 * query string, so nothing a caller appends can make someone else's file look like theirs.
 */
export function ownsBlobPath(pathname: string, user: { id: string; email?: string | null }): boolean {
    const segments = pathname.replace(/^\/+/, '').split('/');
    if (!USER_FOLDERS.has(segments[0])) return false;
    const owners = new Set([user.id, ...(user.email ? [sanitizeEmail(user.email)] : [])]);
    return segments.slice(1, -1).some((s) => owners.has(s));
}

/** Like ownsBlobPath, for a full URL, which must also be one of our blob stores. */
export function ownsBlobUrl(value: string, user: { id: string; email?: string | null }): boolean {
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        return false;
    }
    return isBlobUrl(url) && ownsBlobPath(decodeURIComponent(url.pathname), user);
}

type PutBody = Parameters<typeof put>[1];
type PutOptions = { contentType?: string; addRandomSuffix?: boolean; allowOverwrite?: boolean };

/** Stores a user's file, in the private store when it's configured. Returns its URL. */
export async function putUserFile(pathname: string, body: PutBody, options: PutOptions = {}): Promise<string> {
    const auth = privateAuth();
    if (auth) {
        const blob = await put(pathname, body, { ...options, ...auth, access: 'private' });
        return blob.url;
    }
    if (!warned) {
        warned = true;
        console.warn('[blob] The private store is not configured here (PRIVATE_BLOB_STORE_ID with OIDC, '
            + 'or PRIVATE_BLOB_READ_WRITE_TOKEN), so user files are going to the public store.');
    }
    const blob = await put(pathname, body, { ...options, access: 'public' });
    return blob.url;
}

/**
 * Fetches a stored file from either store, as a Response. `headers` are passed on, so a
 * Range or If-None-Match from the browser still works through /api/blob/file.
 */
export async function readBlob(url: string, headers?: HeadersInit): Promise<Response> {
    if (!isPrivateBlobUrl(url)) return fetch(url, { cache: 'no-store', headers });

    const auth = privateAuth();
    if (!auth) return new Response('Private blob store is not configured', { status: 500 });
    const result = await get(url, { ...auth, access: 'private', useCache: false, headers });
    if (!result) return new Response('Not found', { status: 404 });
    // The SDK's Headers come from undici's types, so copy them into the platform's
    return new Response(result.stream, { status: result.statusCode, headers: Object.fromEntries(result.headers.entries()) });
}

/** Deletes a stored file from whichever store holds it. */
export async function deleteBlob(url: string): Promise<void> {
    if (!isPrivateBlobUrl(url)) return del(url);
    const auth = privateAuth();
    if (!auth) throw new Error('Private blob store is not configured');
    await del(url, auth);
}
