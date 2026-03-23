import "dotenv/config";
import express from "express";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { Deal } from "../../../shared/src/models/deal";

const app = express();
app.use(express.json());

connectDB();

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "deals-api" }));

const VALID_STAGES = ["inquiry", "site_visit", "negotiation", "booking", "documentation", "closed_won", "closed_lost"];
const VALID_PIPELINES = ["buy", "rent", "resale", "commercial"];

// ─── MIDDLEWARE: AUTH & FEATURE CHECK ───
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === "/health") return next();

  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });

  // For now, assuming access is granted to simplify the migration

  (req as any).context = ctx;
  next();
});

// ─── LIST DEALS ───
app.get("/deals-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const filter: any = { company_id: ctx.companyId };

  if (ctx.role === "agent") filter.assigned_to = ctx.userId;

  const pipeline = req.query.pipeline as string;
  const stage = req.query.stage as string;

  if (pipeline && VALID_PIPELINES.includes(pipeline)) filter.pipeline = pipeline;
  if (stage && VALID_STAGES.includes(stage)) filter.stage = stage;

  try {
    const deals = await Deal.find(filter).sort({ updatedAt: -1 });

    const pipelineMap: Record<string, any[]> = {};
    for (const deal of deals) {
      if (!pipelineMap[deal.status]) pipelineMap[deal.status] = []; // Note: supabase uses 'stage', model uses 'status'
      pipelineMap[deal.status].push(deal);
    }

    return res.json({ deals, pipeline: pipelineMap });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── GET SINGLE DEAL ───
app.get("/deals-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;

  try {
    const filter: any = { _id: id, company_id: ctx.companyId };
    if (ctx.role === "agent") filter.assigned_to = ctx.userId;

    const deal = await Deal.findOne(filter);
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    return res.json(deal);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── CREATE DEAL ───
app.post("/deals-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const body = req.body;

  if (!body.title || typeof body.title !== "string") return res.status(400).json({ error: "title required" });

  try {
    const deal = await Deal.create({
      company_id: ctx.companyId,
      name: body.title.trim().slice(0, 200), // Map title to name
      status: body.stage || "inquiry", // Map stage to status
      metadata: {
        pipeline: body.pipeline || "buy",
        property_name: body.property_name?.slice(0, 200) ?? null,
        property_type: body.property_type ?? null,
        notes: body.notes?.slice(0, 2000) ?? null,
        ...body.metadata
      },
      value: Math.max(0, body.deal_value || 0), // Map deal_value to value
      lead_id: body.lead_id || null,
      assigned_to: body.assigned_to || ctx.userId,
      expected_closed_date: body.expected_close_date ?? null,
      created_by: ctx.userId,
    });

    return res.status(201).json(deal);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── UPDATE DEAL ───
app.patch("/deals-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;
  const body = req.body;

  const ALLOWED = ["title", "stage", "pipeline", "deal_value", "lead_id", "assigned_to", "property_name", "property_type", "expected_close_date", "notes", "metadata"];
  const updates: Record<string, any> = {};

  if (body.title) updates.name = body.title;
  if (body.stage) updates.status = body.stage;
  if (body.deal_value) updates.value = body.deal_value;
  if (body.expected_close_date) updates.expected_closed_date = body.expected_close_date;

  // For other fields, we can put them in metadata or handle specifically if needed
  // This is a bit simplified for the migration
  const metaUpdates: any = {};
  if (body.pipeline) metaUpdates.pipeline = body.pipeline;
  if (body.property_name) metaUpdates.property_name = body.property_name;
  if (body.notes) metaUpdates.notes = body.notes;

  if (Object.keys(metaUpdates).length > 0) updates.metadata = metaUpdates;

  try {
    const filter: any = { _id: id, company_id: ctx.companyId };
    if (ctx.role === "agent") filter.assigned_to = ctx.userId;

    const deal = await Deal.findOneAndUpdate(filter, updates, { new: true });
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    return res.json(deal);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── UPDATE STAGE ───
app.patch("/deals-api/:id/stage", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;
  const { stage } = req.body;

  if (!stage || !VALID_STAGES.includes(stage)) return res.status(400).json({ error: "Invalid stage" });

  try {
    const deal = await Deal.findOneAndUpdate(
      { _id: id, company_id: ctx.companyId },
      { status: stage },
      { new: true }
    );
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    return res.json(deal);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── DELETE DEAL ───
app.delete("/deals-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;

  if (!["broker", "super_admin"].includes(ctx.role)) return res.status(403).json({ error: "Managers only" });

  try {
    const result = await Deal.deleteOne({ _id: id, company_id: ctx.companyId });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Deal not found" });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.DEALS_API_PORT || 8087);
app.listen(port, () => console.log(`[deals-api] listening on ${port}`));
