import "dotenv/config";
import express from "express";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { Campaign, CampaignMetric } from "../../../shared/src/models/campaign";

const app = express();
app.use(express.json());

connectDB();

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "campaigns-api" }));

// ─── MIDDLEWARE: AUTH ───
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === "/health") return next();
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });
  (req as any).context = ctx;
  next();
});

// ─── CAMPAIGNS ───
app.get("/campaigns-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  try {
    const campaigns = await Campaign.find({ company_id: ctx.companyId }).sort({ createdAt: -1 });
    return res.json({ campaigns });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/campaigns-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const body = req.body;
  try {
    const campaign = await Campaign.create({
      ...body,
      company_id: ctx.companyId,
      created_by: ctx.userId
    });
    return res.status(201).json(campaign);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/campaigns-api/:id/metrics", async (req: express.Request, res: express.Response) => {
  try {
    const metrics = await CampaignMetric.find({ campaign_id: req.params.id }).sort({ date: -1 });
    return res.json({ metrics });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.CAMPAIGNS_API_PORT || 8097);
app.listen(port, () => console.log(`[campaigns-api] listening on ${port}`));
