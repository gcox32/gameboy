import { Model, Schema } from 'mongoose';
import { registerModel } from './register';

/** One fixed window of requests for a single key, e.g. `login:email:ash@pallet.town`. */
export interface IRateLimit {
    key: string;
    count: number;
    expiresAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>({
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true },
    // TTL index: Mongo deletes the document once the window is over. Its sweep runs about
    // once a minute, so the limiter checks expiresAt itself rather than relying on deletion.
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

const RateLimit: Model<IRateLimit> = registerModel<IRateLimit>('RateLimit', RateLimitSchema);

export default RateLimit;
