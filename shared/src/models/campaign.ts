import mongoose, { Schema, Document } from 'mongoose';

// --- Campaign Model ---
export interface ICampaign extends Document {
    company_id: string;
    name: string;
    type: string; // email, sms, whatsapp
    platform?: 'facebook' | 'google';
    status: string; // draft, active, paused, completed
    start_date?: Date;
    end_date?: Date;
    budget?: number;
    external_campaign_id?: string;
    created_by: string;
    createdAt: Date;
    updatedAt: Date;
}

const CampaignSchema: Schema = new Schema({
    company_id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    platform: { type: String, enum: ['facebook', 'google'] },
    status: { type: String, default: 'draft' },
    start_date: { type: Date },
    end_date: { type: Date },
    budget: { type: Number },
    external_campaign_id: { type: String },
    created_by: { type: String, required: true },
}, { timestamps: true });

CampaignSchema.index({ company_id: 1, external_campaign_id: 1 }, { unique: true, sparse: true });

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);

// --- CampaignMetric Model ---
export interface ICampaignMetric extends Document {
    campaign_id: string;
    date: Date;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    cost: number;
    spend: number;
    leads: number;
}

const CampaignMetricSchema: Schema = new Schema({
    campaign_id: { type: String, required: true },
    date: { type: Date, default: Date.now },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    leads: { type: Number, default: 0 },
}, { timestamps: true });

export const CampaignMetric = mongoose.model<ICampaignMetric>('CampaignMetric', CampaignMetricSchema);
