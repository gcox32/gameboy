import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IStoredPokemon extends Document {
    userId: mongoose.Types.ObjectId;
    sourceGameId: mongoose.Types.ObjectId;
    generation: 1 | 2;
    sourceSlot: {
        location: 'party' | 'box';
        boxNumber?: number;
        slotIndex: number;
    };
    speciesIndex: number;
    speciesName: string;
    nickname: string;
    otName: string;
    otId: number;
    level: number;
    rawBoxData: Buffer;
    extractedAt: Date;
    status: 'stashed' | 'in_game';
    currentGameId?: mongoose.Types.ObjectId;
}

const StoredPokemonSchema = new Schema<IStoredPokemon>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        sourceGameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
        generation: { type: Number, enum: [1, 2], required: true },
        sourceSlot: {
            location: { type: String, enum: ['party', 'box'], required: true },
            boxNumber: { type: Number },
            slotIndex: { type: Number, required: true },
        },
        speciesIndex: { type: Number, required: true },
        speciesName: { type: String, required: true },
        nickname: { type: String, required: true },
        otName: { type: String, required: true },
        otId: { type: Number, required: true },
        level: { type: Number, required: true },
        rawBoxData: { type: Buffer, required: true },
        extractedAt: { type: Date, required: true },
        status: { type: String, enum: ['stashed', 'in_game'], default: 'stashed' },
        currentGameId: { type: Schema.Types.ObjectId, ref: 'Game' },
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

StoredPokemonSchema.index({ userId: 1, status: 1 });
StoredPokemonSchema.index({ userId: 1, speciesIndex: 1 });

const StoredPokemon: Model<IStoredPokemon> =
    mongoose.models.StoredPokemon ??
    mongoose.model<IStoredPokemon>('StoredPokemon', StoredPokemonSchema);

export default StoredPokemon;
