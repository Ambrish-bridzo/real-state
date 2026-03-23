import "dotenv/config";
import express from "express";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { WebhookEndpoint } from "../../../shared/src/models/webhook";
import { WebhookLog } from "../../../shared/src/models/webhook_log";

const app = express();
app.use(express.json());

connectDB();

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "webhooks-api" }));

// ─── MIDDLEWARE: AUTH ───
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === "/health") return next();
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });
  if (!["broker", "super_admin"].includes(ctx.role)) return res.status(403).json({ error: "Managers only" });
  (req as any).context = ctx;
  next();
});

// ─── WEBHOOKS ───
app.get("/webhooks-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  try {
    const webhooks = await WebhookEndpoint.find({ company_id: ctx.companyId }, 'id url events is_active description created_at');
    return res.json({ webhooks });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/webhooks-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const body = req.body;
  if (!body.url) return res.status(400).json({ error: "url required" });

  try {
    const webhook = await WebhookEndpoint.create({
      company_id: ctx.companyId,
      created_by: ctx.userId,
      url: body.url,
      events: body.events || ["lead.created"],
      description: body.description || null,
      secret: "whsec_" + Math.random().toString(36).substring(2),
    });

    return res.status(201).json(webhook);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch("/webhooks-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;
  const body = req.body;

  try {
    const webhook = await WebhookEndpoint.findOneAndUpdate(
      { _id: id, company_id: ctx.companyId },
      { $set: body },
      { new: true }
    );
    if (!webhook) return res.status(404).json({ error: "Webhook not found" });
    return res.json(webhook);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete("/webhooks-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;

  try {
    const result = await WebhookEndpoint.deleteOne({ _id: id, company_id: ctx.companyId });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Webhook not found" });
    return res.json({ status: "deleted" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/webhooks-api/:id/events", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;

  try {
    const logs = await WebhookLog.find({ webhook_id: id, company_id: ctx.companyId })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json({ events: logs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.WEBHOOKS_API_PORT || 8102);
app.listen(port, () => console.log(`[webhooks-api] listening on ${port}`));
