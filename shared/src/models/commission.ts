import mongoose, { Schema, Document } from 'mongoose';

export interface ICommission extends Document {
    company_id: string;
    lead_id: string;
    deal_id?: string;
    agent_id: string;
    amount: number;
    status: string; // pending, approved, paid, rejected
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CommissionSchema: Schema = new Schema({
    company_id: { type: String, required: true },
    lead_id: { type: String, required: true },
    deal_id: { type: String },
    agent_id: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    notes: { type: String },
}, { timestamps: true });

export const Commission = mongoose.model<ICommission>('Commission', CommissionSchema);
