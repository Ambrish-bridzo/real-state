import mongoose, { Schema, Document } from 'mongoose';

// --- Plan Catalog Model ---
export interface IPlan extends Document {
    name: string;
    display_name: string;
    price_monthly: number;
    price_yearly?: number;
    max_agents: number;
    max_leads: number;
    max_automations: number;
    max_storage_mb: number;
    ai_credits: number;
    sms_credits: number;
    sort_order: number;
    is_active: boolean;
}

const PlanSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    display_name: { type: String, required: true },
    price_monthly: { type: Number, default: 0 },
    price_yearly: { type: Number },
    max_agents: { type: Number, default: 10 },
    max_leads: { type: Number, default: 500 },
    max_automations: { type: Number, default: 3 },
    max_storage_mb: { type: Number, default: 1024 },
    ai_credits: { type: Number, default: 0 },
    sms_credits: { type: Number, default: 100 },
    sort_order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
});

export const Plan = mongoose.model<IPlan>('Plan', PlanSchema);

// --- Lead Model ---
export interface ILead extends Document {
    company_id: string;
    assigned_to?: string;
    created_by?: string;
    name: string;
    email?: string;
    phone?: string;
    alternate_phone?: string;
    source: string;
    source_campaign?: string;
    source_medium?: string;
    source_url?: string;
    external_id?: string;
    property_type?: string;
    property_name?: string;
    budget_min?: number;
    budget_max?: number;
    preferred_location?: string;
    bedrooms_min?: number;
    bedrooms_max?: number;
    ai_score?: number;
    conversion_probability?: number;
    status: string;
    is_duplicate: boolean;
    duplicate_of?: string;
    tags: string[];
    custom_fields: any;
    notes?: string;
    last_contacted_at?: Date;
    next_follow_up?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const LeadSchema: Schema = new Schema({
    company_id: { type: String, required: true },
    assigned_to: { type: String },
    created_by: { type: String },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    alternate_phone: { type: String },
    source: { type: String, default: 'other' },
    source_campaign: { type: String },
    source_medium: { type: String },
    source_url: { type: String },
    external_id: { type: String },
    property_type: { type: String },
    property_name: { type: String },
    budget_min: { type: Number },
    budget_max: { type: Number },
    preferred_location: { type: String },
    bedrooms_min: { type: Number },
    bedrooms_max: { type: Number },
    ai_score: { type: Number, default: 0 },
    conversion_probability: { type: Number, default: 0 },
    status: { type: String, default: 'new' },
    is_duplicate: { type: Boolean, default: false },
    duplicate_of: { type: String },
    tags: { type: [String], default: [] },
    custom_fields: { type: Schema.Types.Mixed, default: {} },
    notes: { type: String },
    last_contacted_at: { type: Date },
    next_follow_up: { type: Date },
}, { timestamps: true });

export const Lead = mongoose.model<ILead>('Lead', LeadSchema);
