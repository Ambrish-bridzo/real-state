import "dotenv/config";
import express from "express";
import { z } from "zod";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { Company, Profile } from "../../../shared/src/models/company_profile";
import { User } from "../../../shared/src/models/user";
import { Plan } from "../../../shared/src/models/lead_plan";

const app = express();
app.use(express.json());

connectDB();

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "admin-api" }));

function isOwnerOrSuperAdmin(role: string) {
  return ["owner", "super_admin"].includes(role);
}

// ─── MIDDLEWARE: AUTH & ROLE CHECK ───
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === "/health") return next();

  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });
  if (!isOwnerOrSuperAdmin(ctx.role)) return res.status(403).json({ error: "Owner/SuperAdmin only" });

  (req as any).context = ctx;
  next();
});

// ─── TENANTS ───
app.get("/admin-api/tenants", async (req: express.Request, res: express.Response) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    return res.json({ tenants: companies });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch("/admin-api/tenants/:id", async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const body = req.body;

  const allowed = ["name", "is_active", "onboarding_status", "plan", "plan_id", "max_agents",
    "approved_by", "approved_at", "activated_by", "activated_at", "rejection_reason"];

  const updates: Record<string, any> = {};
  for (const k of allowed) {
    if (body[k] !== undefined) updates[k] = body[k];
  }

  try {
    const company = await Company.findByIdAndUpdate(id, updates, { new: true });
    if (!company) return res.status(404).json({ error: "Company not found" });

    // Note: Audit logs should be migrated separately if needed
    return res.json(company);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── ONBOARDING ───
app.get("/admin-api/onboarding", async (req: express.Request, res: express.Response) => {
  try {
    const companies = await Company.find({
      onboarding_status: { $in: ["pending_approval", "approved", "onboarding"] }
    }).sort({ createdAt: -1 });
    return res.json({ companies });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── PLANS ───
app.get("/admin-api/plans", async (req: express.Request, res: express.Response) => {
  try {
    const plans = await Plan.find().sort({ sort_order: 1 });
    return res.json({ plans });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/admin-api/plans", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  if (ctx.role !== "owner") return res.status(403).json({ error: "Owner only" });

  const planData = req.body;
  if (!planData.name) return res.status(400).json({ error: "name required" });

  try {
    const plan = await Plan.create({
      name: planData.name,
      display_name: planData.display_name || planData.name,
      price_monthly: planData.price_monthly || 0,
      price_yearly: planData.price_yearly,
      max_agents: planData.max_agents || 5,
      max_leads: planData.max_leads || 500,
      max_automations: planData.max_automations || 3,
      max_storage_mb: planData.max_storage_mb || 1024,
      ai_credits: planData.ai_credits || 0,
      sms_credits: planData.sms_credits || 100,
      sort_order: planData.sort_order || 0,
      is_active: planData.is_active ?? true,
    });

    return res.status(201).json(plan);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch("/admin-api/plans/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  if (ctx.role !== "owner") return res.status(403).json({ error: "Owner only" });

  const { id } = req.params;
  const body = req.body;
  const allowed = ["name", "display_name", "price_monthly", "price_yearly", "max_agents", "max_leads", "max_automations", "max_storage_mb", "ai_credits", "sms_credits", "sort_order", "is_active"];

  const updates: Record<string, any> = {};
  for (const k of allowed) {
    if (body[k] !== undefined) updates[k] = body[k];
  }

  try {
    const plan = await Plan.findByIdAndUpdate(id, updates, { new: true });
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    return res.json(plan);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete("/admin-api/plans/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  if (ctx.role !== "owner") return res.status(403).json({ error: "Owner only" });

  const { id } = req.params;
  try {
    await Plan.findByIdAndDelete(id);
    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── REVENUE ───
app.get("/admin-api/revenue", async (req: express.Request, res: express.Response) => {
  try {
    const companies = await Company.find({}, 'id name plan createdAt is_active');
    const activeTenants = companies.filter(c => c.is_active).length;

    return res.json({
      companies,
      mrr: activeTenants * 2999,
      arr: activeTenants * 2999 * 12,
      activeTenants,
      totalTenants: companies.length,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── PROFILES ───
app.get("/admin-api/profiles", async (req: express.Request, res: express.Response) => {
  try {
    const profiles = await Profile.find().sort({ createdAt: -1 });
    return res.json({ profiles });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/admin-api/admins", async (req: express.Request, res: express.Response) => {
  try {
    const admins = await Profile.find({ role: "super_admin" }).sort({ createdAt: -1 });
    return res.json({ profiles: admins });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});


app.post("/admin-api/admins", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  if (ctx.role !== "owner") return res.status(403).json({ error: "Owner only" });

  const { email, password, fullName } = req.body;
  if (!email || !password || !fullName) return res.status(400).json({ error: "email, password, and fullName are required" });

  try {
    const user = await User.create({
      email,
      password,
      emailConfirmed: true,
      rawUserMetaData: { full_name: fullName }
    });

    const profile = await Profile.create({
      user_id: user._id.toString(),
      full_name: fullName,
      email: email,
      role: "super_admin",
      is_active: true
    });

    return res.status(201).json({ user, profile });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});


const port = Number(process.env.ADMIN_API_PORT || 8085);
app.listen(port, () => console.log(`[admin-api] listening on ${port}`));
