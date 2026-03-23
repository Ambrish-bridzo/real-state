import mongoose, { Schema, Document } from 'mongoose';

export interface ICall extends Document {
    company_id: string;
    direction: string; // inbound, outbound
    call_type: string; // manual, auto
    status: string; // ringing, in_progress, completed, failed
    from_number: string;
    to_number: string;
    lead_id?: string;
    assigned_to: string;
    started_at: Date;
    ended_at?: Date;
    duration?: number;
    recording_url?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CallSchema: Schema = new Schema({
    company_id: { type: String, required: true },
    direction: { type: String, required: true },
    call_type: { type: String, required: true },
    status: { type: String, default: 'ringing' },
    from_number: { type: String, required: true },
    to_number: { type: String, required: true },
    lead_id: { type: String },
    assigned_to: { type: String, required: true },
    started_at: { type: Date, default: Date.now },
    ended_at: { type: Date },
    duration: { type: Number },
    recording_url: { type: String },
}, { timestamps: true });

export const Call = mongoose.model<ICall>('Call', CallSchema);
