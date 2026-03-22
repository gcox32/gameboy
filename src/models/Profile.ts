import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProfile extends Document {
    userId: mongoose.Types.ObjectId;
    username: string;
    email: string;
    bio?: string;
    avatar?: string;
    admin: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        username: { type: String, required: true, trim: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        bio: { type: String, default: '' },
        avatar: { type: String },
        admin: { type: Boolean, default: false },
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

const Profile: Model<IProfile> =
    mongoose.models.Profile ?? mongoose.model<IProfile>('Profile', ProfileSchema);

export default Profile;
