import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISaveState extends Document {
    userId: mongoose.Types.ObjectId;
    gameId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    filePath: string;
    img?: string;
    createdAt: Date;
    updatedAt: Date;
}

const SaveStateSchema = new Schema<ISaveState>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
        title: { type: String, required: true, trim: true },
        description: { type: String },
        filePath: { type: String, required: true },
        img: { type: String },
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

SaveStateSchema.index({ userId: 1 });
SaveStateSchema.index({ gameId: 1 });

const SaveState: Model<ISaveState> =
    mongoose.models.SaveState ?? mongoose.model<ISaveState>('SaveState', SaveStateSchema);

export default SaveState;
