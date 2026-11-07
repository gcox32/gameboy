import mongoose, { Model, Schema } from 'mongoose';

/**
 * Compiles a model once per process.
 *
 * In development a hot reload runs the model file again, often because its schema changed.
 * Reusing the model compiled before would keep the old schema, and strict mode would then
 * silently drop new fields from every write. So outside production the old one is replaced.
 */
export function registerModel<T>(name: string, schema: Schema<T>): Model<T> {
    if (process.env.NODE_ENV !== 'production' && mongoose.models[name]) {
        mongoose.deleteModel(name);
    }
    return (mongoose.models[name] as Model<T> | undefined) ?? mongoose.model<T>(name, schema);
}
