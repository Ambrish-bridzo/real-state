import "dotenv/config";
import express from "express";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { Integration, IntegrationSyncJob } from "../../../shared/src/models/integration";

const app = express();
app.use(express.json());

connectDB();

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "integration-manager" }));

// ─── MIDDLEWARE: AUTH ───
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === "/health") return next();
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });
  (req as any).context = ctx;
  next();
});

// ─── INTEGRATIONS ───
app.get("/integration-manager", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  try {
    const data = await Integration.find({ company_id: ctx.companyId });
    return res.json({ integrations: data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/integration-manager/:key/status", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const data = await Integration.findOne({ company_id: ctx.companyId, key: req.params.key });
  if (!data) return res.status(404).json({ error: "Not found" });
  return res.json(data);
});

app.post("/integration-manager", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const body = req.body;
  try {
    const data = await Integration.create({
      ...body,
      company_id: ctx.companyId,
    });
    return res.status(201).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch("/integration-manager/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;
  const body = req.body;
  try {
    const data = await Integration.findOneAndUpdate(
      { _id: id, company_id: ctx.companyId },
      body,
      { new: true }
    );
    if (!data) return res.status(404).json({ error: "Not found" });
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete("/integration-manager/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;
  try {
    const result = await Integration.deleteOne({ _id: id, company_id: ctx.companyId });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Not found" });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/integration-manager/:key/sync", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const integration = await Integration.findOne({ company_id: ctx.companyId, key: req.params.key });
  if (!integration) return res.status(404).json({ error: "Integration not found" });

  try {
    const job = await IntegrationSyncJob.create({
      integration_id: integration._id.toString(),
      company_id: ctx.companyId,
      job_type: "full_sync",
      status: "queued",
      requested_by: ctx.userId
    });

    return res.json(job);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.INTEGRATION_MANAGER_PORT || 8096);
app.listen(port, () => console.log(`[integration-manager] listening on ${port}`));
