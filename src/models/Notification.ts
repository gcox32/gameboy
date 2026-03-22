import mongoose, { Document, Model, Schema } from 'mongoose';

export type NotificationType = 'FRIEND_REQUEST' | 'SYSTEM' | 'INFO';

export interface INotification extends Document {
    userId: string;
    sender: string;
    type: NotificationType;
    title: string;
    body?: string;
    readAt?: Date;
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
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

NotificationSchema.index({ userId: 1, readAt: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

const Notification: Model<INotification> =
    mongoose.models.Notification ??
    mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
