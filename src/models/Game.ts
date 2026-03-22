import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMemoryWatcherEntry {
    baseAddress?: string;
    offset?: string;
    size?: string;
}

export interface IGameMetadata {
    description?: string;
    series?: string;
    generation?: number;
    releaseDate?: string;
    memoryWatchers?: {
        activeParty?: IMemoryWatcherEntry;
        gymBadges?: IMemoryWatcherEntry;
        location?: IMemoryWatcherEntry;
    };
}

export interface IGame extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    filePath: string;
    img?: string;
    metadata?: IGameMetadata;
    createdAt: Date;
    updatedAt: Date;
}

const GameSchema = new Schema<IGame>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true, trim: true },
        filePath: { type: String, required: true },
        img: { type: String },
        metadata: {
            description: String,
            series: String,
            generation: Number,
            releaseDate: String,
            memoryWatchers: {
                activeParty: { baseAddress: String, offset: String, size: String },
                gymBadges: { baseAddress: String, offset: String, size: String },
                location: { baseAddress: String, offset: String, size: String },
            },
        },
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

GameSchema.index({ userId: 1 });

const Game: Model<IGame> =
    mongoose.models.Game ?? mongoose.model<IGame>('Game', GameSchema);

export default Game;
