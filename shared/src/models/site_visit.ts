import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteVisit extends Document {
    user_id: string;
    company_id: string;
    lead_name?: string;
    property_name?: string;
    visit_date: Date;
    start_time?: Date;
    end_time?: Date;
    latitude?: number;
    longitude?: number;
    address?: string;
    status: string; // scheduled, in_progress, completed, cancelled
    feedback?: string;
    client_interested?: boolean;
    photos: string[];
    createdAt: Date;
    updatedAt: Date;
}

const SiteVisitSchema: Schema = new Schema({
    user_id: { type: String, required: true },
    company_id: { type: String, required: true },
    lead_name: { type: String },
    property_name: { type: String },
    visit_date: { type: Date, default: Date.now },
    start_time: { type: Date },
    end_time: { type: Date },
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String },
    status: { type: String, default: 'scheduled' },
    feedback: { type: String },
    client_interested: { type: Boolean },
    photos: { type: [String], default: [] },
}, { timestamps: true });

export const SiteVisit = mongoose.model<ISiteVisit>('SiteVisit', SiteVisitSchema);
