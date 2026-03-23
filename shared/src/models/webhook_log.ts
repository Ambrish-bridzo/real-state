import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookLog extends Document {
    webhook_id: string; // Reference to WebhookEndpoint
    company_id: string;
    event_type: string;
    payload: any;
    request_headers?: any;
    response_status?: number;
    response_body?: string;
    error?: string;
    duration_ms?: number;
    createdAt: Date;
}

const WebhookLogSchema: Schema = new Schema({
    webhook_id: { type: String, required: true, index: true },
    company_id: { type: String, required: true, index: true },
    event_type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    request_headers: { type: Schema.Types.Mixed },
    response_status: { type: Number },
    response_body: { type: String },
    error: { type: String },
    duration_ms: { type: Number },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const WebhookLog = mongoose.model<IWebhookLog>('WebhookLog', WebhookLogSchema);
