'use client';

import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

const subToUsernameCache: Map<string, string> = new Map();

export async function getUsernameForSub(sub: string): Promise<string> {
    if (!sub) {
        return '';
    }

    const cached = subToUsernameCache.get(sub);
    if (cached) {
        return cached;
    }

    try {
        const response = await client.models.Profile.list({
            filter: {
                owner: { eq: sub }
            }
        });

        const profile = response.data?.[0] as unknown as { username?: string } | undefined;
        const username = profile?.username ?? sub;

        subToUsernameCache.set(sub, username);
        return username;
    } catch (_err) {
        // Fall back to the sub when fetching fails
        return sub;
    }
}

export async function getUsernamesForSubs(subs: string[]): Promise<Record<string, string>> {
    const uniqueSubs = Array.from(new Set(subs.filter(Boolean)));

    const result: Record<string, string> = {};

    // Seed with any cached values
    for (const sub of uniqueSubs) {
        const cached = subToUsernameCache.get(sub);
        if (cached) {
            result[sub] = cached;
        }
    }

    const subsToFetch = uniqueSubs.filter((s) => !(s in result));
    if (subsToFetch.length === 0) {
        return result;
    }

    // Fetch sequentially to keep it simple and avoid API filter limitations
    for (const sub of subsToFetch) {
        const username = await getUsernameForSub(sub);
        result[sub] = username;
    }

    return result;
}


