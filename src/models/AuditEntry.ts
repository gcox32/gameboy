import { Model, Schema, Types } from 'mongoose';
import { registerModel } from './register';

export const AUDIT_ACTIONS = [
    'user.update',
    'user.delete',
    'user.resendVerification',
    'user.verifyEmail',
    'user.sendPasswordReset',
    'user.clearRateLimits',
    'game.update',
    'game.delete',
    'save.update',
    'save.delete',
    'notification.send',
    'notification.delete',
    'storage.deleteOrphans',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/**
 * One thing an admin did. Names are copied in when it happens, so the entry still reads
 * after the admin, the account or the record is gone.
 */
export interface IAuditEntry {
    _id: Types.ObjectId;
    actorId: string;
    actorEmail: string;
    action: AuditAction;
    /** The account acted on, or whose record it was. None for broadcasts and storage. */
    targetUserId?: string;
    targetEmail?: string;
    /** The record acted on, if not the account itself */
    targetId?: string;
    /** What the record was called: a game's title, a notification's title */
    targetLabel?: string;
    /** What changed, e.g. { admin: { from: false, to: true } } or the counts deleted */
    details?: Record<string, unknown>;
    createdAt: Date;
}

const AuditEntrySchema = new Schema<IAuditEntry>(
    {
        actorId: { type: String, required: true },
        actorEmail: { type: String, required: true },
        action: { type: String, enum: AUDIT_ACTIONS, required: true },
        targetUserId: { type: String },
        targetEmail: { type: String },
        targetId: { type: String },
        targetLabel: { type: String },
        details: { type: Schema.Types.Mixed },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);

// Pages go newest first by _id, which is in creation order; the default _id index covers the full log
AuditEntrySchema.index({ targetUserId: 1, _id: -1 });

const AuditEntry: Model<IAuditEntry> = registerModel<IAuditEntry>('AuditEntry', AuditEntrySchema);

export default AuditEntry;
