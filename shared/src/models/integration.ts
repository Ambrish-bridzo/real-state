import mongoose, { Schema, Document } from 'mongoose';

export interface IIntegration extends Document {
    company_id: string;
    key: string; // e.g., facebook, google, slack
    name: string;
    type: 'webhook' | 'email' | 'whatsapp' | 'social' | 'external' | 'other';
    status: 'active' | 'inactive' | 'error';
    webhook_url?: string;
    webhook_secret?: string;
    field_mapping: Record<string, string>;
    settings: any;
    is_active: boolean;
    config: any;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
}

const IntegrationSchema: Schema = new Schema({
    company_id: { type: String, required: true },
    key: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['webhook', 'email', 'whatsapp', 'social', 'external', 'other'], default: 'webhook' },
    status: { type: String, enum: ['active', 'inactive', 'error'], default: 'active' },
    webhook_url: { type: String },
    webhook_secret: { type: String },
    field_mapping: { type: Map, of: String, default: {} },
    settings: { type: Schema.Types.Mixed, default: {} },
    is_active: { type: Boolean, default: true },
    config: { type: Schema.Types.Mixed, default: {} },
    metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Compound index for company_id and key
IntegrationSchema.index({ company_id: 1, key: 1 }, { unique: true });

export const Integration = mongoose.model<IIntegration>('Integration', IntegrationSchema);

export interface IIntegrationSyncJob extends Document {
    integration_id: string;
    company_id: string;
    job_type: string; // full_sync, partial_sync
    status: string; // queued, running, completed, failed
    requested_by: string;
    started_at?: Date;
    finished_at?: Date;
    error_message?: string;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
}

const IntegrationSyncJobSchema: Schema = new Schema({
    integration_id: { type: String, required: true, ref: 'Integration' },
    company_id: { type: String, required: true },
    job_type: { type: String, required: true },
    status: { type: String, default: 'queued' },
    requested_by: { type: String, required: true },
    started_at: { type: Date },
    finished_at: { type: Date },
    error_message: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const IntegrationSyncJob = mongoose.model<IIntegrationSyncJob>('IntegrationSyncJob', IntegrationSyncJobSchema);
