import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookEndpoint extends Document {
    company_id: string;
    created_by: string;
    url: string;
    events: string[];
    is_active: boolean;
    description?: string;
    secret: string;
    createdAt: Date;
    updatedAt: Date;
}

const WebhookEndpointSchema: Schema = new Schema({
    company_id: { type: String, required: true },
    created_by: { type: String, required: true },
    url: { type: String, required: true },
    events: { type: [String], default: ['lead.created'] },
    is_active: { type: Boolean, default: true },
    description: { type: String },
    secret: { type: String, required: true },
}, { timestamps: true });

export const WebhookEndpoint = mongoose.model<IWebhookEndpoint>('WebhookEndpoint', WebhookEndpointSchema);
