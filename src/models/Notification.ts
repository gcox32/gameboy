import mongoose, { Document, Model, Schema } from 'mongoose';
import { registerModel } from './register';

export type NotificationType = 'FRIEND_REQUEST' | 'SYSTEM' | 'INFO';

export interface INotification extends Document {
    userId: string;
    sender: string;
    type: NotificationType;
    title: string;
    body?: string;
    /** Direct notifications only. A broadcast is read per user, in readBy. */
    readAt?: Date;
    /** Broadcasts only: who has read it, and when */
    readBy?: { userId: string; readAt: Date }[];
    /** Gone after this: hidden at once, and deleted by Mongo's TTL sweep soon after */
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: { type: String, required: true },  // ObjectId hex OR 'BROADCAST'
        sender: { type: String, required: true },
        type: { type: String, enum: ['FRIEND_REQUEST', 'SYSTEM', 'INFO'], required: true },
        title: { type: String, required: true },
        body: { type: String },
        readAt: { type: Date },
        readBy: {
            type: [new Schema({ userId: { type: String, required: true }, readAt: { type: Date, required: true } }, { _id: false })],
            default: undefined,
        },
        expiresAt: { type: Date },
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

NotificationSchema.index({ userId: 1, readAt: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
// Only documents with expiresAt are swept
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification: Model<INotification> = registerModel<INotification>('Notification', NotificationSchema);

export default Notification;
