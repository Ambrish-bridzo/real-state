import mongoose, { Schema, Document } from 'mongoose';

// --- Meeting Model ---
export interface IMeeting extends Document {
    company_id: string;
    title: string;
    description?: string;
    meeting_type: string; // meeting, site_visit, callback
    status: string; // scheduled, done, not_done, overdue
    lead_id?: string;
    lead_name?: string;
    assigned_to: string;
    created_by: string;
    scheduled_at: Date;
    completed_at?: Date;
    location?: string;
    notes?: string;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
}

const MeetingSchema: Schema = new Schema({
    company_id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    meeting_type: { type: String, default: 'meeting' },
    status: { type: String, default: 'scheduled' },
    lead_id: { type: String },
    lead_name: { type: String },
    assigned_to: { type: String, required: true },
    created_by: { type: String, required: true },
    scheduled_at: { type: Date, required: true },
    completed_at: { type: Date },
    location: { type: String },
    notes: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const Meeting = mongoose.model<IMeeting>('Meeting', MeetingSchema);

// --- Attendance Model ---
export interface IAttendance extends Document {
    user_id: string;
    company_id: string;
    clock_in: Date;
    clock_out?: Date;
    clock_in_lat?: number;
    clock_in_lng?: number;
    clock_out_lat?: number;
    clock_out_lng?: number;
    status: string; // present, half_day, late, absent
    notes?: string;
    createdAt: Date;
}

const AttendanceSchema: Schema = new Schema({
    user_id: { type: String, required: true },
    company_id: { type: String, required: true },
    clock_in: { type: Date, default: Date.now },
    clock_out: { type: Date },
    clock_in_lat: { type: Number },
    clock_in_lng: { type: Number },
    clock_out_lat: { type: Number },
    clock_out_lng: { type: Number },
    status: { type: String, default: 'present' },
    notes: { type: String },
}, { timestamps: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
