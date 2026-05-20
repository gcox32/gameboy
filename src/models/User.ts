import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
    email: string;
    passwordHash: string;
    emailVerified: boolean;
    admin: boolean;
    verificationToken?: string;
    verificationTokenExpiry?: Date;
    resetToken?: string;
    resetTokenExpiry?: Date;
    appTrainerId?: number;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        emailVerified: { type: Boolean, default: false },
        admin: { type: Boolean, default: false },
        verificationToken: { type: String },
        verificationTokenExpiry: { type: Date },
        resetToken: { type: String },
        resetTokenExpiry: { type: Date },
        appTrainerId: { type: Number },
    },
    { timestamps: true }
);

const User: Model<IUser> =
    mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);

export default User;
