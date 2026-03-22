'use client';

/**
 * Upload a file to Vercel Blob via the /api/blob/upload route.
 * @param file  The File object to upload.
 * @param path  The blob pathname, e.g. "games/{userId}/{gameId}/cover.jpg"
 * @returns     The permanent public URL of the uploaded blob.
 */
export async function uploadBlob(file: File, path: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

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
