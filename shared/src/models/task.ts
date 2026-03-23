import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
    company_id: string;
    title: string;
    description?: string;
    priority: string;
    status: string;
    assigned_to: string;
    created_by: string;
    lead_id?: string;
    scheduled_at?: Date;
    due_date?: Date;
    completed_at?: Date;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema: Schema = new Schema({
    company_id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    priority: { type: String, default: 'medium' },
    status: { type: String, default: 'pending' },
    assigned_to: { type: String, required: true },
    created_by: { type: String, required: true },
    lead_id: { type: String },
    scheduled_at: { type: Date },
    due_date: { type: Date },
    completed_at: { type: Date },
    metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
