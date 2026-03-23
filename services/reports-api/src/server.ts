import "dotenv/config";
import express from "express";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { Lead } from "../../../shared/src/models/lead_plan";
import { Deal } from "../../../shared/src/models/deal";
import { SiteVisit } from "../../../shared/src/models/site_visit";
import { Activity } from "../../../shared/src/models/activity";

const app = express();
app.use(express.json());

connectDB();

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "reports-api" }));

// ─── MIDDLEWARE: AUTH ───
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === "/health") return next();
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });
  (req as any).context = ctx;
  next();
});

// ─── DASHBOARD STATS ───
app.get("/reports-api/dashboard", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  try {
    const leadsCount = await Lead.countDocuments({ company_id: ctx.companyId });
    const deals = await Deal.find({ company_id: ctx.companyId });
    const siteVisits = await SiteVisit.find({ company_id: ctx.companyId });

    const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
    const wonCount = deals.filter(d => d.status === "won").length;

    return res.json({
      leads: leadsCount,
      deals: deals.length,
      totalValue,
      wonCount,
      siteVisits: siteVisits.length,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── ACTIVITIES ───
app.get("/reports-api/activities", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { lead_id, activity_type, limit = 50, page = 1 } = req.query;

  const filter: any = { company_id: ctx.companyId };
  if (lead_id) filter.lead_id = lead_id;
  if (activity_type) filter.activity_type = activity_type;

  try {
    const activities = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.json({ activities });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/reports-api/activities", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { lead_id, activity_type, title, description, metadata } = req.body;

  try {
    const activity = await Activity.create({
      company_id: ctx.companyId,
      user_id: ctx.userId,
      lead_id,
      activity_type,
      title,
      description,
      metadata
    });
    return res.status(201).json(activity);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.REPORTS_API_PORT || 8092);
app.listen(port, () => console.log(`[reports-api] listening on ${port}`));
