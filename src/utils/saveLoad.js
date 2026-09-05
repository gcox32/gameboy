
export async function fetchUserSaveStates(userId, gameId) {
    try {
        const url = gameId
            ? `/api/save-states?gameId=${encodeURIComponent(gameId)}`
            : '/api/save-states';
        const res = await fetch(url);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

export async function loadInGameFile(filePath, version) {
    // ROMs are overwritten in-place in Vercel Blob (same URL), and blobs are served
    // with a long-lived, immutable Cache-Control. Append a version token (the game's
    // updatedAt) so a replaced ROM produces a distinct browser/CDN cache key.
    let url = filePath;
    if (version !== undefined && version !== null && version !== '') {
        const token = encodeURIComponent(String(version));
        url += (filePath.includes('?') ? '&' : '?') + `v=${token}`;
    }
    return fetch(url);
}

// Vercel Blob URLs are permanent — just return the value stored in the DB directly.
export async function getS3Url(key) {
    if (!key) return null;
    return key;
}
