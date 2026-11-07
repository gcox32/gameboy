import mongoose, { Document, Model, Schema } from 'mongoose';
import { registerModel } from './register';

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
    nicknameBytes?: Buffer;
    otNameBytes?: Buffer;
    otId: number;
    level: number;
    rawBoxData: Buffer;
    /** Its moves as the source game describes them. Absent if that game's ROM couldn't be read. */
    moves?: { id: number; name: string; type: string; PP: number; basepower: number; accuracy: number }[];
    extractedAt: Date;
    /** The pen it lives in. Unset on arrival until the Ranch settles it into one. */
    penId?: mongoose.Types.ObjectId | null;
    status: 'stashed' | 'transferring';
    transfer?: {
        direction: 'to_ranch' | 'to_save';
        saveStateId: mongoose.Types.ObjectId;
        fromFilePath: string;
        toFilePath: string;
        startedAt: Date;
    };
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
        // Decoded for display and can be empty. A required string would reject ''.
        nickname: { type: String, default: '' },
        otName: { type: String, default: '' },
        // The game's own bytes (11 each), written back unchanged on port. Absent on older records.
        nicknameBytes: { type: Buffer },
        otNameBytes: { type: Buffer },
        otId: { type: Number, required: true },
        level: { type: Number, required: true },
        rawBoxData: { type: Buffer, required: true },
        // Read from the source game's ROM when the Pokémon leaves it, since the Ranch has no ROM
        // and hacks rename and retype moves. Absent on older records.
        moves: {
            type: [new Schema(
                {
                    id: { type: Number, required: true },
                    name: { type: String, required: true },
                    type: { type: String, required: true },
                    PP: { type: Number, required: true },
                    basepower: { type: Number, required: true },
                    accuracy: { type: Number, required: true },
                },
                { _id: false },
            )],
            default: undefined,
        },
        extractedAt: { type: Date, required: true },
        penId: { type: Schema.Types.ObjectId, ref: 'RanchPen', default: null },
        // A record means the Pokémon is at the Ranch. It's deleted once the Pokémon is in a
        // save, which is then the source of truth. `transferring` is only held mid-move.
        status: { type: String, enum: ['stashed', 'transferring'], default: 'stashed' },
        transfer: {
            type: new Schema(
                {
                    direction: { type: String, enum: ['to_ranch', 'to_save'], required: true },
                    saveStateId: { type: Schema.Types.ObjectId, ref: 'SaveState', required: true },
                    fromFilePath: { type: String, required: true },
                    toFilePath: { type: String, required: true },
                    startedAt: { type: Date, required: true },
                },
                { _id: false },
            ),
        },
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

StoredPokemonSchema.index({ userId: 1, status: 1 });
StoredPokemonSchema.index({ userId: 1, speciesIndex: 1 });
StoredPokemonSchema.index({ userId: 1, penId: 1 });

const StoredPokemon: Model<IStoredPokemon> = registerModel<IStoredPokemon>('StoredPokemon', StoredPokemonSchema);

export default StoredPokemon;
