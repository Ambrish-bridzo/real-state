import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkflow extends Document {
    company_id: string;
    name: string;
    description?: string;
    is_active: boolean;
    nodes: any[];
    edges: any[];
    trigger_type: string;
    last_run_at?: Date;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
}

const WorkflowSchema: Schema = new Schema({
    company_id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    is_active: { type: Boolean, default: true },
    nodes: { type: [Schema.Types.Mixed], default: [] },
    edges: { type: [Schema.Types.Mixed], default: [] },
    trigger_type: { type: String },
    last_run_at: { type: Date },
    metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const Workflow = mongoose.model<IWorkflow>('Workflow', WorkflowSchema);

export interface IWorkflowRun extends Document {
    workflow_id: string;
    company_id: string;
    status: string; // pending, running, completed, failed
    trigger_type: string;
    trigger_data: any;
    started_at?: Date;
    finished_at?: Date;
    error_message?: string;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
}

const WorkflowRunSchema: Schema = new Schema({
    workflow_id: { type: String, required: true, ref: 'Workflow' },
    company_id: { type: String, required: true },
    status: { type: String, default: 'pending' },
    trigger_type: { type: String, required: true },
    trigger_data: { type: Schema.Types.Mixed, default: {} },
    started_at: { type: Date },
    finished_at: { type: Date },
    error_message: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const WorkflowRun = mongoose.model<IWorkflowRun>('WorkflowRun', WorkflowRunSchema);

export interface IWorkflowRunStep extends Document {
    run_id: string;
    node_id: string;
    node_type: string;
    status: string; // completed, failed
    input_data: any;
    output_data: any;
    started_at: Date;
    finished_at: Date;
    error_message?: string;
}

const WorkflowRunStepSchema: Schema = new Schema({
    run_id: { type: String, required: true, ref: 'WorkflowRun' },
    node_id: { type: String, required: true },
    node_type: { type: String, required: true },
    status: { type: String, required: true },
    input_data: { type: Schema.Types.Mixed },
    output_data: { type: Schema.Types.Mixed },
    started_at: { type: Date, required: true },
    finished_at: { type: Date, required: true },
    error_message: { type: String },
}, { timestamps: true });

export const WorkflowRunStep = mongoose.model<IWorkflowRunStep>('WorkflowRunStep', WorkflowRunStepSchema);
