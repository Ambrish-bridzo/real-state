import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
    company_id: string;
    user_id: string;
    activity_type: string; // call, email, site_visit, note, status_change, etc.
    title: string;
    description?: string;
    lead_id?: string;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
}

const ActivitySchema: Schema = new Schema({
    company_id: { type: String, required: true },
    user_id: { type: String, required: true },
    activity_type: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    lead_id: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
