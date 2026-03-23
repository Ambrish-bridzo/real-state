import { pgPool } from "../../../../shared/src/postgres";
import { DEFAULT_EVENTS, generateWebhookSecret } from "./validators";

export class NotFoundError extends Error {}

type CreateWebhookInput = {
  companyId: string;
  userId: string;
  payload: {
    url: string;
    events?: string[];
    description?: string;
    is_active?: boolean;
  };
};

type ListWebhooksInput = {
  page: number;
  limit: number;
  sortBy: "created_at" | "updated_at" | "url";
  sortOrder: "asc" | "desc";
  q?: string;
  isActive?: boolean;
  event?: string;
  companyId?: string;
};

type WebhookRow = {
  id: string;
  company_id: string;
  url: string;
  events: string[];
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
  secret?: string;
};

export async function createWebhook({ companyId, userId, payload }: CreateWebhookInput) {
  const events = payload.events?.length ? payload.events : [...DEFAULT_EVENTS];
  const secret = generateWebhookSecret();

  const { rows } = await pgPool.query<WebhookRow>(
    `
      INSERT INTO public.webhook_endpoints
      (company_id, created_by, url, secret, events, description, is_active)
      VALUES ($1, $2, $3, $4, $5::text[], $6, $7)
      RETURNING id, company_id, url, events, is_active, description, created_at, updated_at, secret
    `,
    [companyId, userId, payload.url, secret, events, payload.description ?? null, payload.is_active ?? true],
  );

  return rows[0];
}

export async function listWebhooks(input: ListWebhooksInput) {
  const { page, limit, sortBy, sortOrder, q, isActive, event, companyId } = input;
  const params: unknown[] = [];
  const where: string[] = [];

  if (q) {
    params.push(`%${q}%`);
    where.push(`(url ILIKE $${params.length} OR COALESCE(description, '') ILIKE $${params.length})`);
  }

  if (typeof isActive === "boolean") {
    params.push(isActive);
    where.push(`is_active = $${params.length}`);
  }

  if (event) {
    params.push(event);
    where.push(`events @> ARRAY[$${params.length}]::text[]`);
  }

  if (companyId) {
    params.push(companyId);
    where.push(`company_id = $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const safeSortBy = sortBy;
  const safeSortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const countResult = await pgPool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM public.webhook_endpoints ${whereSql}`,
    params,
  );

  const offset = (page - 1) * limit;
  const listParams = [...params, limit, offset];
  const listResult = await pgPool.query<WebhookRow>(
    `
      SELECT id, company_id, url, events, is_active, description, created_at, updated_at
      FROM public.webhook_endpoints
      ${whereSql}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT $${listParams.length - 1} OFFSET $${listParams.length}
    `,
    listParams,
  );

  return {
    webhooks: listResult.rows,
    pagination: { page, limit, total: Number(countResult.rows[0]?.total || 0) },
    sorting: { sortBy, sortOrder },
  };
}

export async function getWebhookById(id: string, companyId?: string) {
  const params: unknown[] = [id];
  let whereSql = `WHERE id = $1`;

  if (companyId) {
    params.push(companyId);
    whereSql += ` AND company_id = $2`;
  }

  const { rows } = await pgPool.query<WebhookRow>(
    `
      SELECT id, company_id, url, events, is_active, description, created_at, updated_at
      FROM public.webhook_endpoints
      ${whereSql}
      LIMIT 1
    `,
    params,
  );

  if (!rows[0]) throw new NotFoundError("Webhook not found");
  return rows[0];
}

export async function listWebhookEvents(webhookId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;

  const countResult = await pgPool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM public.webhook_events WHERE webhook_id = $1`,
    [webhookId],
  );

  const { rows } = await pgPool.query(
    `
      SELECT id, webhook_id, event_type, response_status, response_body, attempt, status, created_at
      FROM public.webhook_events
      WHERE webhook_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `,
    [webhookId, limit, offset],
  );

  return {
    events: rows,
    pagination: { page, limit, total: Number(countResult.rows[0]?.total || 0) },
  };
}

export async function updateWebhook(id: string, updates: Record<string, unknown>, companyId?: string) {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (updates.url !== undefined) {
    params.push(updates.url);
    sets.push(`url = $${params.length}`);
  }

  if (updates.events !== undefined) {
    params.push(updates.events);
    sets.push(`events = $${params.length}::text[]`);
  }

  if (updates.description !== undefined) {
    params.push(updates.description);
    sets.push(`description = $${params.length}`);
  }

  if (updates.is_active !== undefined) {
    params.push(updates.is_active);
    sets.push(`is_active = $${params.length}`);
  }

  params.push(id);
  let whereSql = `id = $${params.length}`;

  if (companyId) {
    params.push(companyId);
    whereSql += ` AND company_id = $${params.length}`;
  }

  const { rows } = await pgPool.query<WebhookRow>(
    `
      UPDATE public.webhook_endpoints
      SET ${sets.join(", ")}, updated_at = now()
      WHERE ${whereSql}
      RETURNING id, company_id, url, events, is_active, description, created_at, updated_at
    `,
    params,
  );

  if (!rows[0]) throw new NotFoundError("Webhook not found");
  return rows[0];
}

export async function deleteWebhook(id: string, companyId?: string) {
  const params: unknown[] = [id];
  let whereSql = `id = $1`;

  if (companyId) {
    params.push(companyId);
    whereSql += ` AND company_id = $2`;
  }

  const { rows } = await pgPool.query<{ id: string; company_id: string }>(
    `DELETE FROM public.webhook_endpoints WHERE ${whereSql} RETURNING id, company_id`,
    params,
  );

  if (!rows[0]) throw new NotFoundError("Webhook not found");
  return rows[0];
}

export async function writeWebhookAuditLog(params: {
  userId: string;
  companyId: string;
  action: "webhook_created" | "webhook_updated" | "webhook_deleted";
  resourceId: string;
}) {
  await pgPool.query(
    `
      INSERT INTO public.audit_logs
      (user_id, company_id, action, resource_type, resource_id)
      VALUES ($1, $2, $3, 'webhook_endpoint', $4)
    `,
    [params.userId, params.companyId, params.action, params.resourceId],
  );
}
