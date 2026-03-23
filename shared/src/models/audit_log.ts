import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    company_id: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    old_data?: any;
    new_data?: any;
    ip_address?: string;
    user_agent?: string;
    createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
    company_id: { type: String, required: true },
    user_id: { type: String, required: true },
    action: { type: String, required: true },
    entity_type: { type: String, required: true },
    entity_id: { type: String, required: true },
    old_data: { type: Schema.Types.Mixed },
    new_data: { type: Schema.Types.Mixed },
    ip_address: { type: String },
    user_agent: { type: String },
}, { timestamps: true });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
