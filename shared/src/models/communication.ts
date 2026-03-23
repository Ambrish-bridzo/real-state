import mongoose, { Schema, Document } from 'mongoose';

// --- Message Model ---
export interface IMessage extends Document {
    company_id: string;
    user_id: string;
    conversation_id?: string;
    lead_id?: string;
    sender?: string;
    receiver?: string;
    content: string;
    channel: string; // sms, email, whatsapp
    direction: string; // inbound, outbound
    status: string; // sent, delivered, failed
    external_message_id?: string;
    metadata: any;
    media_url?: string;
    media_type?: string;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema: Schema = new Schema({
    company_id: { type: String, required: true },
    user_id: { type: String, required: true },
    conversation_id: { type: String },
    lead_id: { type: String },
    sender: { type: String },
    receiver: { type: String },
    content: { type: String, required: true },
    channel: { type: String, required: true },
    direction: { type: String, required: true },
    status: { type: String, default: 'sent' },
    external_message_id: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    media_url: { type: String },
    media_type: { type: String },
}, { timestamps: true });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);

// --- CommunicationConfig Model ---
export interface ICommunicationConfig extends Document {
    company_id: string;
    type: string; // whatsapp, email
    provider: string; // meta, twilio, sendgrid, smtp
    config: any;
    is_active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CommunicationConfigSchema: Schema = new Schema({
    company_id: { type: String, required: true },
    type: { type: String, required: true },
    provider: { type: String, required: true },
    config: { type: Schema.Types.Mixed, required: true },
    is_active: { type: Boolean, default: true },
}, { timestamps: true });

// Compound index for company_id and type
CommunicationConfigSchema.index({ company_id: 1, type: 1 }, { unique: true });

export const CommunicationConfig = mongoose.model<ICommunicationConfig>('CommunicationConfig', CommunicationConfigSchema);
