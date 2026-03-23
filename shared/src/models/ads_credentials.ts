import mongoose, { Schema, Document } from 'mongoose';

export interface IUserAdsCredentials extends Document {
    user_id: string;
    company_id: string;
    facebook_credentials?: string; // encrypted
    google_credentials?: string; // encrypted
    is_facebook_connected: boolean;
    is_google_connected: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserAdsCredentialsSchema: Schema = new Schema({
    user_id: { type: String, required: true },
    company_id: { type: String, required: true },
    facebook_credentials: { type: String },
    google_credentials: { type: String },
    is_facebook_connected: { type: Boolean, default: false },
    is_google_connected: { type: Boolean, default: false },
}, { timestamps: true });

// Compound index for company_id and user_id uniqueness
UserAdsCredentialsSchema.index({ company_id: 1, user_id: 1 }, { unique: true });

export const UserAdsCredentials = mongoose.model<IUserAdsCredentials>('UserAdsCredentials', UserAdsCredentialsSchema);
