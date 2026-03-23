import "dotenv/config";
import express from "express";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { Workflow } from "../../../shared/src/models/workflow";
import { AuditLog } from "../../../shared/src/models/audit_log";

const app = express();
app.use(express.json());

connectDB();

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "workflows-api" }));

// ─── MIDDLEWARE: AUTH & FEATURE CHECK ───
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === "/health") return next();
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });

  // Simplified check_feature_access for now (could be moved to a helper)
  const hasAccess = true;
  if (!hasAccess) return res.status(403).json({ error: "FEATURE_DISABLED", message: "Workflows feature is not available on your plan" });

  if (!["broker", "super_admin"].includes(ctx.role) && req.method !== "GET") {
    return res.status(403).json({ error: "Managers only" });
  }

  (req as any).context = ctx;
  next();
});

// ─── LIST WORKFLOWS ───
app.get("/workflows-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  try {
    const data = await Workflow.find({ company_id: ctx.companyId })
      .sort({ createdAt: -1 });
    return res.json({ workflows: data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── GET SINGLE WORKFLOW ───
app.get("/workflows-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;
  const data = await Workflow.findOne({ _id: id, company_id: ctx.companyId });

  if (!data) return res.status(404).json({ error: "Workflow not found" });
  return res.json(data);
});

// ─── CREATE WORKFLOW ───
app.post("/workflows-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const body = req.body;
  if (!body.name) return res.status(400).json({ error: "name required" });

  try {
    const data = await Workflow.create({
      company_id: ctx.companyId,
      name: body.name,
      description: body.description || null,
      nodes: body.nodes || [],
      edges: body.edges || [],
      is_active: body.is_active ?? false,
      metadata: { created_by: ctx.userId }
    });

    await AuditLog.create({
      user_id: ctx.userId,
      company_id: ctx.companyId,
      action: "workflow_created",
      entity_type: "workflow",
      entity_id: data._id.toString(),
    });

    return res.status(201).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── UPDATE WORKFLOW ───
app.patch("/workflows-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;
  const body = req.body;

  delete body.company_id;
  delete body._id;

  try {
    const data = await Workflow.findOneAndUpdate(
      { _id: id, company_id: ctx.companyId },
      { $set: body },
      { new: true }
    );

    if (!data) return res.status(404).json({ error: "Workflow not found" });

    await AuditLog.create({
      user_id: ctx.userId,
      company_id: ctx.companyId as string,
      action: "workflow_updated",
      entity_type: "workflow",
      entity_id: id as string,
    });

    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── DELETE WORKFLOW ───
app.delete("/workflows-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;
  try {
    const result = await Workflow.deleteOne({ _id: id, company_id: ctx.companyId });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Workflow not found" });

    await AuditLog.create({
      user_id: ctx.userId,
      company_id: ctx.companyId as string,
      action: "workflow_deleted",
      entity_type: "workflow",
      entity_id: id as string,
    });

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.WORKFLOWS_API_PORT || 8094);
app.listen(port, () => console.log(`[workflows-api] listening on ${port}`));
