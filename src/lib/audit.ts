import { isValidObjectId } from 'mongoose';
import type { Session } from 'next-auth';
import { AUDIT_ACTIONS, AuditEntry, User, type AuditAction, type IAuditEntry } from '@/models';

export type AuditInput = Omit<IAuditEntry, '_id' | 'actorId' | 'actorEmail' | 'createdAt'>;

/**
 * Records what an admin just did. Called after the action succeeds, so a failure here is
 * logged rather than thrown: the action has happened, and the caller should hear that it did.
 */
export async function recordAudit(session: Session, entry: AuditInput): Promise<void> {
    const actorId = session.user.id;
    const actorEmail = session.user.email ?? actorId;
    try {
        if (entry.targetUserId && !entry.targetEmail && isValidObjectId(entry.targetUserId)) {
            const owner = await User.findById(entry.targetUserId).select('email').lean();
            entry = { ...entry, targetEmail: owner?.email };
        }
    } catch { /* the entry is still worth having without it */ }
    console.info(`[admin] ${actorEmail} ${entry.action}`, entry.targetEmail ?? entry.targetLabel ?? '', entry.details ?? '');
    try {
        await AuditEntry.create({ ...entry, actorId, actorEmail });
    } catch (err) {
        console.error(`[admin] couldn't record ${entry.action} by ${actorId}:`, err);
    }
}

/** True when the caller is acting on someone else's record, the only case the log is for */
export const actingForOthers = (session: Session, ownerId: unknown) => String(ownerId) !== session.user.id;

/** The action groups the log can be filtered by: the part before the dot */
export const AUDIT_GROUPS = [...new Set(AUDIT_ACTIONS.map((a) => a.split('.')[0]))];

export interface AuditQuery {
    /** Only entries about this account */
    userId?: string;
    /** Only this group of actions, e.g. 'user' */
    group?: string;
    /** The id of the last entry already shown */
    before?: string;
    limit?: number;
}

export const MAX_PAGE = 100;

/** A page of entries, newest first, and the cursor for the next page if there is one */
export async function listAudit({ userId, group, before, limit = 50 }: AuditQuery = {}) {
    const pageSize = Math.min(Math.max(1, Math.floor(limit) || 50), MAX_PAGE);
    const filter: Record<string, unknown> = {};
    if (userId) filter.targetUserId = userId;
    if (group) filter.action = { $in: AUDIT_ACTIONS.filter((a) => a.startsWith(`${group}.`)) as AuditAction[] };
    if (before && isValidObjectId(before)) filter._id = { $lt: before };

    // One extra tells whether there's another page, without counting
    const rows = await AuditEntry.find(filter).sort({ _id: -1 }).limit(pageSize + 1).lean();
    const page = rows.slice(0, pageSize);
    return {
        entries: page.map(({ _id, ...rest }) => ({ ...rest, id: String(_id), createdAt: rest.createdAt.toISOString() })),
        next: rows.length > pageSize ? String(page[page.length - 1]._id) : null,
    };
}
