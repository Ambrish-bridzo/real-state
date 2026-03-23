import { randomBytes } from "crypto";
import { z } from "zod";

export const DEFAULT_EVENTS = ["lead.created", "lead.updated", "lead.status_changed"] as const;
export const SORTABLE_FIELDS = ["created_at", "updated_at", "url"] as const;

export const createWebhookSchema = z.object({
  url: z.string().url().max(2000),
  events: z.array(z.string().min(1).max(100)).max(20).optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
});

export const updateWebhookSchema = z
  .object({
    url: z.string().url().max(2000).optional(),
    events: z.array(z.string().min(1).max(100)).max(20).optional(),
    description: z.string().max(500).nullable().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: "At least one field is required" });

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(SORTABLE_FIELDS).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  q: z.string().trim().max(200).optional(),
  is_active: z.enum(["true", "false"]).optional(),
  event: z.string().trim().max(100).optional(),
  company_id: z.string().uuid().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("hex")}`;
}

export function toBool(value?: string): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function roleCanReadAll(role: string): boolean {
  return role === "owner" || role === "super_admin";
}
