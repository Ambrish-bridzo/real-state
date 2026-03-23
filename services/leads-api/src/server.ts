import "dotenv/config";
import express from "express";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { Lead } from "../../../shared/src/models/lead_plan";
import axios from "axios";

const app = express();
app.use(express.json());

connectDB();

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "leads-api" }));

const VALID_SOURCES = ["99acres", "magicbricks", "housing_com", "nobroker", "facebook", "instagram", "google_ads", "website", "referral", "walk_in", "other"];
const VALID_STATUSES = ["new", "contacted", "qualified", "negotiation", "won", "lost"];

// ─── MIDDLEWARE: AUTH & FEATURE CHECK ───
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === "/health") return next();

  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });

  // Note: Feature access check should be updated to use MongoDB later if needed
  // For now, we'll assume access is granted to simplify the migration

  (req as any).context = ctx;
  next();
});

const DISPATCHER_URL = process.env.WEBHOOK_DISPATCHER_URL || "http://localhost:8103";
const CORE_ENGINE_URL = process.env.CORE_ENGINE_URL || `http://localhost:${process.env.CORE_PORT || 8082}`;
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || "leadflow-internal-token-2026";

async function triggerWebhook(companyId: string, eventType: string, payload: any) {
  try {
    await axios.post(`${DISPATCHER_URL}/webhook-dispatcher/dispatch`, {
      company_id: companyId,
      event_type: eventType,
      payload
    }).catch(e => console.error(`[leads-api] webhook dispatch failed: ${e.message}`));
  } catch (err) {
    // Ignore trigger errors to not block API response
  }
}

async function sendNotification(payload: {
  company_id: string;
  user_id?: string | null;
  type: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  link_url?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await axios.post(`${CORE_ENGINE_URL}/core/internal/notify`, payload, {
      headers: { "x-internal-token": INTERNAL_SERVICE_TOKEN },
    }).catch((error) => console.error(`[leads-api] notification dispatch failed: ${error.message}`));
  } catch (_error) {
    // Ignore notification errors to avoid blocking the primary action
  }
}

// ─── LIST LEADS ───
app.get("/leads-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const filter: any = { company_id: ctx.companyId };

  if (ctx.role === "agent") filter.assigned_to = ctx.userId;

  const status = req.query.status as string;
  const source = req.query.source as string;
  const search = req.query.search as string;
  const limit = Math.min(parseInt(String(req.query.limit || "50"), 10), 200);
  const page = Math.max(parseInt(String(req.query.page || "1"), 10), 1);

  if (status && status !== "all" && VALID_STATUSES.includes(status)) filter.status = status;
  if (source && source !== "all" && VALID_SOURCES.includes(source)) filter.source = source;

  if (search && search.length <= 100) {
    const s = search.replace(/%/g, "");
    filter.$or = [
      { name: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
      { phone: { $regex: s, $options: "i" } }
    ];
  }

  try {
    const leads = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Lead.countDocuments(filter);

    return res.json({ leads, total });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── GET SINGLE LEAD ───
app.get("/leads-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;

  try {
    const lead = await Lead.findOne({ _id: id, company_id: ctx.companyId });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    if (ctx.role === "agent" && lead.assigned_to !== ctx.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.json(lead);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── CREATE LEAD ───
app.post("/leads-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const body = req.body;

  if (!body.name || typeof body.name !== "string" || body.name.trim().length < 1) {
    return res.status(400).json({ error: "name is required" });
  }

  // Duplicate check
  if (body.phone || body.email) {
    const dupFilter: any = {
      company_id: ctx.companyId,
      is_duplicate: false,
      $or: []
    };
    if (body.phone) dupFilter.$or.push({ phone: body.phone });
    if (body.email) dupFilter.$or.push({ email: body.email });

    if (dupFilter.$or.length > 0) {
      const dupes = await Lead.find(dupFilter).limit(5);
      if (dupes && dupes.length > 0) {
        return res.status(409).json({ error: "Potential duplicate found", duplicates: dupes });
      }
    }
  }

  try {
    const lead = await Lead.create({
      ...body,
      company_id: ctx.companyId,
      created_by: ctx.userId,
    });

    triggerWebhook(ctx.companyId, "lead.created", lead);
    if (lead.assigned_to) {
      sendNotification({
        company_id: ctx.companyId,
        user_id: lead.assigned_to,
        type: "lead_assigned",
        title: "New lead assigned",
        message: `${lead.name} was assigned to you from ${lead.source || "manual entry"}.`,
        entity_type: "lead",
        entity_id: lead._id.toString(),
        link_url: "/leads",
        metadata: {
          lead_name: lead.name,
          source: lead.source,
        },
      });
    }

    return res.status(201).json(lead);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── UPDATE LEAD ───
app.patch("/leads-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;
  const body = req.body;

  try {
    const lead = await Lead.findOne({ _id: id, company_id: ctx.companyId });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    if (ctx.role === "agent" && lead.assigned_to !== ctx.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updatedLead = await Lead.findByIdAndUpdate(id, body, { new: true });

    if (updatedLead) {
      const eventType = body.status && body.status !== lead.status ? "lead.status_changed" : "lead.updated";
      triggerWebhook(ctx.companyId, eventType, updatedLead);

      if (body.assigned_to && body.assigned_to !== lead.assigned_to) {
        sendNotification({
          company_id: ctx.companyId,
          user_id: body.assigned_to,
          type: "lead_assigned",
          title: "Lead assigned to you",
          message: `${updatedLead.name} has been assigned to you.`,
          entity_type: "lead",
          entity_id: updatedLead._id.toString(),
          link_url: "/leads",
          metadata: {
            lead_name: updatedLead.name,
            source: updatedLead.source,
          },
        });
      }
    }

    return res.json(updatedLead);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── DELETE LEAD ───
app.delete("/leads-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;

  if (!["broker", "super_admin"].includes(ctx.role)) return res.status(403).json({ error: "Managers only" });

  try {
    const result = await Lead.deleteOne({ _id: id, company_id: ctx.companyId });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Lead not found" });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.LEADS_API_PORT || 8086);
app.listen(port, () => console.log(`[leads-api] listening on ${port}`));
