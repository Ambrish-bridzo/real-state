import mongoose, { Schema, Document } from 'mongoose';

// --- Company Model ---
export interface ICompany extends Document {
    name: string;
    rera_license?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    logo_url?: string;
    website?: string;
    plan: string;
    plan_id?: string;
    owner_id: string; // Refers to User.id (as string for simplicity during transition)
    max_agents: number;
    enforce_team_two_factor: boolean;
    onboarding_status: string;
    is_active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CompanySchema: Schema = new Schema({
    name: { type: String, required: true },
    rera_license: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    logo_url: { type: String },
    website: { type: String },
    plan: { type: String, default: 'pro' },
    plan_id: { type: String },
    owner_id: { type: String, required: true },
    max_agents: { type: Number, default: 10 },
    enforce_team_two_factor: { type: Boolean, default: false },
    onboarding_status: { type: String, default: 'pending_approval' },
    is_active: { type: Boolean, default: true },
}, { timestamps: true });

export const Company = mongoose.model<ICompany>('Company', CompanySchema);

// --- Profile Model ---
export interface IProfile extends Document {
    user_id: string; // Refers to User.id
    full_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    role: string;
    company_id?: string; // Refers to Company.id
    is_active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProfileSchema: Schema = new Schema({
    user_id: { type: String, required: true, unique: true },
    full_name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    avatar_url: { type: String },
    role: { type: String, default: 'agent' },
    company_id: { type: String },
    is_active: { type: Boolean, default: true },
}, { timestamps: true });

export const Profile = mongoose.model<IProfile>('Profile', ProfileSchema);
