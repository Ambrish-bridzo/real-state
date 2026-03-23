import { Router } from "express";
import { getRequestContext } from "../../../../shared/src/auth";
import {
  createWebhookSchema,
  idParamSchema,
  listQuerySchema,
  roleCanReadAll,
  toBool,
  updateWebhookSchema,
} from "./validators";
import {
  createWebhook,
  deleteWebhook,
  getWebhookById,
  listWebhookEvents,
  listWebhooks,
  updateWebhook,
  writeWebhookAuditLog,
  NotFoundError,
} from "./service";

function mapKnownError(res: any, error: unknown, notFoundMessage: string) {
  if (error instanceof NotFoundError) return res.status(404).json({ error: notFoundMessage });
  const err = error as { code?: string; message?: string };
  if (err?.code === "23505") return res.status(409).json({ error: "Conflict" });
  return res.status(500).json({ error: err?.message || "Internal server error" });
}

export const webhooksRouter = Router();

webhooksRouter.post("/", async (req, res) => {
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });
  if (!["broker", "owner", "super_admin"].includes(ctx.role)) return res.status(403).json({ error: "Forbidden" });
  if (!ctx.companyId) return res.status(400).json({ error: "Missing company context" });

  const parsed = createWebhookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const webhook = await createWebhook({ companyId: ctx.companyId, userId: ctx.userId, payload: parsed.data });
    await writeWebhookAuditLog({
      userId: ctx.userId,
      companyId: ctx.companyId,
      action: "webhook_created",
      resourceId: webhook.id,
    });
    return res.status(201).json({ webhook });
  } catch (error) {
    return mapKnownError(res, error, "Webhook not found");
  }
});

webhooksRouter.get("/", async (req, res) => {
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });

  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const listInput = {
    ...parsed.data,
    isActive: toBool(parsed.data.is_active),
    companyId: roleCanReadAll(ctx.role) ? parsed.data.company_id : ctx.companyId || undefined,
  };

  if (!roleCanReadAll(ctx.role) && !ctx.companyId) return res.status(400).json({ error: "Missing company context" });

  try {
    const response = await listWebhooks(listInput);
    return res.json(response);
  } catch (error) {
    return mapKnownError(res, error, "Webhook not found");
  }
});

webhooksRouter.get("/:id", async (req, res) => {
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });

  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (!roleCanReadAll(ctx.role) && !ctx.companyId) return res.status(400).json({ error: "Missing company context" });

  try {
    const webhook = await getWebhookById(parsed.data.id, roleCanReadAll(ctx.role) ? undefined : ctx.companyId || undefined);
    return res.json({ webhook });
  } catch (error) {
    return mapKnownError(res, error, "Webhook not found");
  }
});

webhooksRouter.get("/:id/events", async (req, res) => {
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });

  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (!roleCanReadAll(ctx.role) && !ctx.companyId) return res.status(400).json({ error: "Missing company context" });

  const limit = Math.min(Math.max(parseInt(String(req.query.limit || "50"), 10), 1), 100);
  const page = Math.max(parseInt(String(req.query.page || "1"), 10), 1);

  try {
    const webhook = await getWebhookById(parsed.data.id, roleCanReadAll(ctx.role) ? undefined : ctx.companyId || undefined);
    const response = await listWebhookEvents(webhook.id, page, limit);
    return res.json(response);
  } catch (error) {
    return mapKnownError(res, error, "Webhook not found");
  }
});

webhooksRouter.patch("/:id", async (req, res) => {
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });
  if (!["broker", "owner", "super_admin"].includes(ctx.role)) return res.status(403).json({ error: "Forbidden" });
  if (!roleCanReadAll(ctx.role) && !ctx.companyId) return res.status(400).json({ error: "Missing company context" });

  const idParsed = idParamSchema.safeParse(req.params);
  if (!idParsed.success) return res.status(400).json({ error: idParsed.error.flatten() });

  const bodyParsed = updateWebhookSchema.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: bodyParsed.error.flatten() });

  try {
    const webhook = await updateWebhook(
      idParsed.data.id,
      bodyParsed.data,
      roleCanReadAll(ctx.role) ? undefined : ctx.companyId || undefined,
    );

    await writeWebhookAuditLog({
      userId: ctx.userId,
      companyId: webhook.company_id,
      action: "webhook_updated",
      resourceId: webhook.id,
    });

    return res.json({ webhook });
  } catch (error) {
    return mapKnownError(res, error, "Webhook not found");
  }
});

webhooksRouter.delete("/:id", async (req, res) => {
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });
  if (!["broker", "owner", "super_admin"].includes(ctx.role)) return res.status(403).json({ error: "Forbidden" });
  if (!roleCanReadAll(ctx.role) && !ctx.companyId) return res.status(400).json({ error: "Missing company context" });

  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const deleted = await deleteWebhook(parsed.data.id, roleCanReadAll(ctx.role) ? undefined : ctx.companyId || undefined);

    await writeWebhookAuditLog({
      userId: ctx.userId,
      companyId: deleted.company_id,
      action: "webhook_deleted",
      resourceId: deleted.id,
    });

    return res.status(204).send();
  } catch (error) {
    return mapKnownError(res, error, "Webhook not found");
  }
});
