import mongoose, { Schema, Document } from 'mongoose';

// --- BillingTransaction Model ---
export interface IBillingTransaction extends Document {
    company_id: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    amount: number; // in paise
    currency: string;
    status: string; // created, paid, failed, approved, rejected
    plan_id: string;
    billing_cycle: string; // monthly, yearly
    remarks?: string;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
}

const BillingTransactionSchema: Schema = new Schema({
    company_id: { type: String, required: true },
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, default: 'created' },
    plan_id: { type: String, required: true },
    billing_cycle: { type: String, required: true },
    remarks: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const BillingTransaction = mongoose.model<IBillingTransaction>('BillingTransaction', BillingTransactionSchema);

// --- BillingUsage Model ---
export interface IBillingUsage extends Document {
    company_id: string;
    billing_period_start: Date;
    billing_period_end: Date;
    agents_count: number;
    leads_count: number;
    ai_credits_used: number;
    sms_credits_used: number;
    storage_bytes: number;
    createdAt: Date;
    updatedAt: Date;
}

const BillingUsageSchema: Schema = new Schema({
    company_id: { type: String, required: true },
    billing_period_start: { type: Date, required: true },
    billing_period_end: { type: Date, required: true },
    agents_count: { type: Number, default: 0 },
    leads_count: { type: Number, default: 0 },
    ai_credits_used: { type: Number, default: 0 },
    sms_credits_used: { type: Number, default: 0 },
    storage_bytes: { type: Number, default: 0 },
}, { timestamps: true });

export const BillingUsage = mongoose.model<IBillingUsage>('BillingUsage', BillingUsageSchema);

// --- BillingCoupon Model ---
export interface IBillingCoupon extends Document {
    code: string;
    discount_type: string; // percentage, fixed
    discount_value: number;
    is_active: boolean;
    max_uses?: number;
    used_count: number;
    expires_at?: Date;
}

const BillingCouponSchema: Schema = new Schema({
    code: { type: String, required: true, unique: true },
    discount_type: { type: String, required: true },
    discount_value: { type: Number, required: true },
    is_active: { type: Boolean, default: true },
    max_uses: { type: Number },
    used_count: { type: Number, default: 0 },
    expires_at: { type: Date },
}, { timestamps: true });

export const BillingCoupon = mongoose.model<IBillingCoupon>('BillingCoupon', BillingCouponSchema);
