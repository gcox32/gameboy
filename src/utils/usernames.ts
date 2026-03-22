'use client';

const userIdToUsernameCache: Map<string, string> = new Map();

export async function getUsernameForUserId(userId: string): Promise<string> {
    if (!userId) return '';

    const cached = userIdToUsernameCache.get(userId);
    if (cached) return cached;

    try {
        const res = await fetch(`/api/profiles?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) return userId;
        const profile = await res.json();
        const username = profile?.username ?? userId;
        userIdToUsernameCache.set(userId, username);
        return username;
    } catch {
        return userId;
    }
}

export async function getUsernamesByUserIds(userIds: string[]): Promise<Record<string, string>> {
    const unique = Array.from(new Set(userIds.filter(Boolean)));
    const result: Record<string, string> = {};

    for (const id of unique) {
        const cached = userIdToUsernameCache.get(id);
        if (cached) result[id] = cached;
    }

    const toFetch = unique.filter((id) => !(id in result));
    for (const id of toFetch) {
        result[id] = await getUsernameForUserId(id);
    }

    return result;
}

// Backward-compat alias used by admin components
export const getUsernamesForSubs = getUsernamesByUserIds;
