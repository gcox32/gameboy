'use client';

/**
 * The URL to read one of the user's stored files from. Files in the private store can only be
 * read through /api/blob/file, which checks they're yours; anything else is returned as is.
 */
export function blobReadUrl<T extends string | null | undefined>(url: T): T | string {
    if (!url) return url;
    try {
        if (!new URL(url).hostname.endsWith('.private.blob.vercel-storage.com')) return url;
    } catch {
        return url; // relative, data: or blob: URLs
    }
    return `/api/blob/file?url=${encodeURIComponent(url)}`;
}

/** Adds a cache-busting version to a URL, for files replaced in place. */
export function withVersion(url: string | null | undefined, version?: string | null): string {
    if (!url) return '';
    return `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(version ?? '')}`;
}

/**
 * Upload a file to Vercel Blob via the /api/blob/upload route.
 * @param file  The File object to upload.
 * @param path  The blob pathname, e.g. "games/{userId}/{gameId}/cover.jpg"
 * @param options.unique  Give this upload its own URL instead of replacing the file at
 *                        that path. Save files need this: their URL is their version.
 * @returns     The permanent public URL of the uploaded blob.
 */
export async function uploadBlob(file: File, path: string, options: { unique?: boolean } = {}): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    if (options.unique) formData.append('unique', 'true');

    const res = await fetch('/api/blob/upload', { method: 'POST', body: formData });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Upload failed (${res.status})`);
    }
    const { url } = await res.json();
    return url as string;
}

/**
 * Delete a blob by its URL via the /api/blob route.
 */
export async function deleteBlob(url: string): Promise<void> {
    if (!url) return;
    await fetch(`/api/blob?url=${encodeURIComponent(url)}`, { method: 'DELETE' });
}
