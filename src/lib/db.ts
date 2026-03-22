import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
}

// Reuse connection across hot reloads in development
declare global {
    // eslint-disable-next-line no-var
    var _mongooseConn: Promise<typeof mongoose> | undefined;
}

let cached = global._mongooseConn;

export async function dbConnect(): Promise<typeof mongoose> {
    if (cached) return cached;

    cached = global._mongooseConn = mongoose.connect(MONGODB_URI, {
        bufferCommands: false,
    });

    return cached;
}
