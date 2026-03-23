import mongoose, { Schema, Document } from 'mongoose';

export interface IApiKey extends Document {
    company_id: string;
    created_by: string;
    name: string;
    key_hash: string;
    key_prefix: string;
    scopes: string[];
    is_active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ApiKeySchema: Schema = new Schema({
    company_id: { type: String, required: true },
    created_by: { type: String, required: true },
    name: { type: String, default: 'Default' },
    key_hash: { type: String, required: true, unique: true },
    key_prefix: { type: String, required: true },
    scopes: { type: [String], default: ['leads.read'] },
    is_active: { type: Boolean, default: true },
}, { timestamps: true });

export const ApiKey = mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
