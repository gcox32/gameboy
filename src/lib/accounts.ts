import crypto from 'crypto';
import { RateLimit, User } from '@/models';
import type { IUser } from '@/models';
import { mailer } from './email';
import { AUTH_LIMITS } from './rateLimit';

/*
 * Account emails and state shared by the public auth routes and the admin view, so a code or
 * reset link sent from either works the same way.
 */

type Account = Pick<IUser, '_id' | 'email'>;

/** Issues a fresh 6-digit verification code, valid for 24 hours, and emails it. */
export async function sendVerificationCode(user: Account): Promise<void> {
    const verificationToken = crypto.randomInt(100000, 999999).toString();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await User.updateOne({ _id: user._id }, { verificationToken, verificationTokenExpiry });
    await mailer.sendVerificationEmail(user.email, verificationToken);
}

/** Issues a password reset link, valid for an hour, and emails it. */
export async function sendPasswordReset(user: Account): Promise<void> {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await User.updateOne({ _id: user._id }, { resetToken, resetTokenExpiry });
    await mailer.sendPasswordResetEmail(user.email, resetToken);
}

/** Marks the email verified without a code, as entering the code would. */
export async function markEmailVerified(userId: IUser['_id'] | string): Promise<void> {
    await User.updateOne(
        { _id: userId },
        { $set: { emailVerified: true }, $unset: { verificationToken: '', verificationTokenExpiry: '' } },
    );
}

export interface EmailLimit {
    /** The auth action counted, e.g. `login` */
    action: string;
    count: number;
    max: number;
    blocked: boolean;
    resetsAt: Date;
}

const EMAIL_KEY = /^(\w+):email:(.+)$/;

/**
 * The rate limit windows still open for each email, by email. Only the per-email limits:
 * the per-IP ones aren't tied to an account.
 */
export async function emailLimits(): Promise<Map<string, EmailLimit[]>> {
    const now = new Date();
    const windows = await RateLimit.find({ key: /:email:/, expiresAt: { $gt: now } }).lean();
    const byEmail = new Map<string, EmailLimit[]>();
    for (const w of windows) {
        const [, action, email] = w.key.match(EMAIL_KEY) ?? [];
        const max = (AUTH_LIMITS as Record<string, { email?: { max: number } }>)[action]?.email?.max;
        if (!email || max === undefined) continue;
        const list = byEmail.get(email) ?? [];
        list.push({ action, count: w.count, max, blocked: w.count > max, resetsAt: w.expiresAt });
        byEmail.set(email, list);
    }
    return byEmail;
}

/** Ends every per-email limit window for this email, so they can try again now. Returns how many. */
export async function clearEmailLimits(email: string): Promise<number> {
    const escaped = email.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const { deletedCount } = await RateLimit.deleteMany({ key: new RegExp(`^\\w+:email:${escaped}$`) });
    return deletedCount;
}
