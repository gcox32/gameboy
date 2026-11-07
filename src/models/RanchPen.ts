import mongoose, { Document, Model, Schema } from 'mongoose';
import { registerModel } from './register';

/**
 * A named field at the Ranch. Each holds up to PEN_CAPACITY Pokémon, so the scene never gets
 * too crowded to see who's there. Pens belong to a user; Pokémon point at their pen.
 */
export interface IRanchPen extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    /** Position among the user's pens, lowest first */
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const RanchPenSchema = new Schema<IRanchPen>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true, trim: true },
        order: { type: Number, required: true },
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

// Unique so two requests adding the same pen at once can't make two (see addPen)
RanchPenSchema.index({ userId: 1, order: 1 }, { unique: true });

const RanchPen: Model<IRanchPen> = registerModel<IRanchPen>('RanchPen', RanchPenSchema);

export default RanchPen;
