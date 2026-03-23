import mongoose, { Schema, Document } from 'mongoose';

export interface IDeal extends Document {
    company_id: string;
    lead_id: string;
    name: string;
    value: number;
    status: string; // pipeline, discovery, proposal, negotiation, won, lost
    probability: number;
    expected_closed_date?: Date;
    assigned_to: string;
    created_by: string;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
}

const DealSchema: Schema = new Schema({
    company_id: { type: String, required: true },
    lead_id: { type: String, required: true },
    name: { type: String, required: true },
    value: { type: Number, default: 0 },
    status: { type: String, default: 'pipeline' },
    probability: { type: Number, default: 0 },
    expected_closed_date: { type: Date },
    assigned_to: { type: String, required: true },
    created_by: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const Deal = mongoose.model<IDeal>('Deal', DealSchema);
