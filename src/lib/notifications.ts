import { isValidObjectId } from 'mongoose';
import { Profile, User, type NotificationType } from '@/models';

export const BROADCAST = 'BROADCAST';
export const MAX_TITLE = 120;
export const MAX_BODY = 2000;
/** The furthest ahead a notification can be set to expire */
export const MAX_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000;
/** Kinds an admin can send. Friend requests come from people, not the admin panel. */
export const ADMIN_TYPES: NotificationType[] = ['SYSTEM', 'INFO'];

/** Matches notifications that haven't expired. Mongo's sweep runs about once a minute, so this hides them until then. */
export const notExpired = (now = new Date()) => ({
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
});

export interface NotificationDraft {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    expiresAt?: Date;
}

/** Checks an admin's notification, resolving to what to store or the reason it can't be sent */
export async function validateDraft(input: Record<string, unknown>, now = Date.now()):
    Promise<{ draft: NotificationDraft; recipientEmail?: string; error?: undefined } | { error: string; status: number }> {
    const { userId, type, title, body, expiresAt } = input;

    if (typeof title !== 'string' || !title.trim()) return { error: 'A title is required', status: 400 };
    if (title.trim().length > MAX_TITLE) return { error: `The title can be at most ${MAX_TITLE} characters`, status: 400 };
    if (body !== undefined && typeof body !== 'string') return { error: 'The message must be text', status: 400 };
    if (typeof body === 'string' && body.trim().length > MAX_BODY) return { error: `The message can be at most ${MAX_BODY} characters`, status: 400 };
    if (!ADMIN_TYPES.includes(type as NotificationType)) return { error: `type must be one of ${ADMIN_TYPES.join(', ')}`, status: 400 };

    let expiry: Date | undefined;
    if (expiresAt !== undefined && expiresAt !== null && expiresAt !== '') {
        expiry = new Date(expiresAt as string);
        if (typeof expiresAt !== 'string' || Number.isNaN(expiry.getTime())) return { error: 'expiresAt must be a date', status: 400 };
        if (expiry.getTime() <= now) return { error: 'The expiry has to be in the future', status: 400 };
        if (expiry.getTime() - now > MAX_EXPIRY_MS) return { error: 'The expiry can be at most a year away', status: 400 };
    }

    let recipientEmail: string | undefined;
    if (userId !== BROADCAST) {
        if (typeof userId !== 'string' || !isValidObjectId(userId)) return { error: 'userId must be an account id or BROADCAST', status: 400 };
        const user = await User.findById(userId).select('email').lean();
        if (!user) return { error: 'No such account', status: 404 };
        recipientEmail = user.email;
    }

    return {
        draft: {
            userId,
            type: type as NotificationType,
            title: title.trim(),
            ...(typeof body === 'string' && body.trim() && { body: body.trim() }),
            ...(expiry && { expiresAt: expiry }),
        },
        recipientEmail,
    };
}

/** What to call each of these accounts: its username, or its email without a profile. Ids that aren't accounts are left out. */
export async function accountNames(ids: string[]): Promise<Map<string, string>> {
    const unique = [...new Set(ids)].filter((id) => isValidObjectId(id));
    if (!unique.length) return new Map();
    const [users, profiles] = await Promise.all([
        User.find({ _id: { $in: unique } }).select('email').lean(),
        Profile.find({ userId: { $in: unique } }).select('userId username').lean(),
    ]);
    const names = new Map(users.map((u) => [String(u._id), u.email]));
    for (const p of profiles) if (p.username) names.set(String(p.userId), p.username);
    return names;
}
