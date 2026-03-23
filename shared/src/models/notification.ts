import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  company_id: string;
  user_id?: string | null;
  type: string;
  title: string;
  message: string;
  entity_type?: string | null;
  entity_id?: string | null;
  link_url?: string | null;
  metadata: Record<string, unknown>;
  read_at?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    company_id: { type: String, required: true, index: true },
    user_id: { type: String, default: null, index: true },
    type: { type: String, required: true, default: "info" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    entity_type: { type: String, default: null },
    entity_id: { type: String, default: null },
    link_url: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    read_at: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
