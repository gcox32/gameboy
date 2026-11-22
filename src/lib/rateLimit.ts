import { NextResponse } from 'next/server';
import { RateLimit } from '@/models';

/**
 * Fixed-window rate limiting backed by Mongo, so no extra service is needed.
 *
 * Each key holds one document: a count and the moment its window ends. A single atomic
 * update either increments the count or, once the window has passed, starts a new one,
 * so concurrent requests can't both slip in under the limit. A TTL index removes old windows.
 */

export interface Limit {
    key: string;
    max: number;
    windowMs: number;
}

export interface LimitResult {
    ok: boolean;
    /** Seconds until the most restrictive exceeded window resets; 0 when ok. */
    retryAfter: number;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/** Limits per auth action, each counted per email and per IP so neither spreading across accounts nor across addresses gets around them. */
export const AUTH_LIMITS = {
    login: { email: { max: 10, windowMs: 15 * MINUTE }, ip: { max: 30, windowMs: 15 * MINUTE } },
    register: { ip: { max: 5, windowMs: HOUR } },
    verify: { email: { max: 10, windowMs: HOUR }, ip: { max: 30, windowMs: HOUR } },
    resendVerification: { email: { max: 3, windowMs: HOUR }, ip: { max: 10, windowMs: HOUR } },
    forgotPassword: { email: { max: 3, windowMs: HOUR }, ip: { max: 10, windowMs: HOUR } },
    resetPassword: { ip: { max: 10, windowMs: HOUR } },
} as const;

type Action = keyof typeof AUTH_LIMITS;

/** Records one request against a key and reports whether it is still within the limit. */
export async function hit({ key, max, windowMs }: Limit): Promise<LimitResult> {
    const now = new Date();
    const windowOpen = { $gt: ['$expiresAt', now] };
    const update = [{
        $set: {
            count: { $cond: [windowOpen, { $add: ['$count', 1] }, 1] },
            expiresAt: { $cond: [windowOpen, '$expiresAt', new Date(now.getTime() + windowMs)] },
        },
    }];

    let doc;
    try {
        doc = await RateLimit.findOneAndUpdate({ key }, update, {
            upsert: true, returnDocument: 'after', updatePipeline: true,
        }).lean();
    } catch (err) {
        // Two first requests for a new key can race to insert it; the loser retries as an update.
        if ((err as { code?: number }).code !== 11000) throw err;
        doc = await RateLimit.findOneAndUpdate({ key }, update, {
            returnDocument: 'after', updatePipeline: true,
        }).lean();
    }

    if (!doc || doc.count <= max) return { ok: true, retryAfter: 0 };
    return { ok: false, retryAfter: Math.max(1, Math.ceil((doc.expiresAt.getTime() - now.getTime()) / 1000)) };
}

/**
 * Counts one request for an auth action against its email and IP limits.
 * Every applicable limit is counted, even after one is exceeded, so each stays accurate.
 */
export async function limitAuth(
    action: Action,
    { email, ip }: { email?: string; ip?: string },
): Promise<LimitResult> {
    const config: { email?: Omit<Limit, 'key'>; ip?: Omit<Limit, 'key'> } = AUTH_LIMITS[action];
    const limits: Limit[] = [];
    if (config.email && email) limits.push({ key: `${action}:email:${email.trim().toLowerCase()}`, ...config.email });
    if (config.ip && ip) limits.push({ key: `${action}:ip:${ip}`, ...config.ip });

    const results = await Promise.all(limits.map(hit));
    const blocked = results.filter((r) => !r.ok);
    if (blocked.length === 0) return { ok: true, retryAfter: 0 };
    return { ok: false, retryAfter: Math.max(...blocked.map((r) => r.retryAfter)) };
}

/** The caller's IP. Vercel sets x-forwarded-for with the client first; locally it may be absent. */
export function clientIp(headers: Headers): string | undefined {
    const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    return forwarded || headers.get('x-real-ip') || undefined;
}

export function tooManyRequests(retryAfter: number): NextResponse {
    const minutes = Math.ceil(retryAfter / 60);
    return NextResponse.json(
        { error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.` },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
}
