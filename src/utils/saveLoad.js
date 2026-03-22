
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

export async function loadInGameFile(filePath) {
    return fetch(filePath);
}

// Vercel Blob URLs are permanent — just return the value stored in the DB directly.
export async function getS3Url(key) {
    if (!key) return null;
    return key;
}
