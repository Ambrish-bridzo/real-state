import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
    company_id: string; // Referred to as broker_id in some places
    channel: string; // whatsapp, email
    customer_identifier: string; // phone number or email address
    last_message?: string;
    last_message_at?: Date;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema: Schema = new Schema({
    company_id: { type: String, required: true },
    channel: { type: String, required: true },
    customer_identifier: { type: String, required: true },
    last_message: { type: String },
    last_message_at: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Compound index for unique conversation per company/channel/customer
ConversationSchema.index({ company_id: 1, channel: 1, customer_identifier: 1 }, { unique: true });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
