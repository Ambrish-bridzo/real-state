import "dotenv/config";
import express from "express";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { Profile, Company } from "../../../shared/src/models/company_profile";
import { User } from "../../../shared/src/models/user";

const app = express();
app.use(express.json());

connectDB();

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "team-api" }));

// ─── MIDDLEWARE: AUTH & ROLE CHECK ───
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === "/health") return next();

  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });

  if (!["broker", "super_admin"].includes(ctx.role)) {
    return res.status(403).json({ error: "Forbidden: insufficient role" });
  }

  (req as any).context = ctx;
  next();
});

// ─── LIST TEAM ───
app.get("/team-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  try {
    const profiles = await Profile.find({ company_id: ctx.companyId }).sort({ full_name: 1 });
    return res.json(profiles);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── INVITE MEMBER ───
app.post("/team-api/invite", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { email, fullName, role, password } = req.body;

  if (!email || !fullName || !password || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check limits
    const company = await Company.findById(ctx.companyId);
    if (!company) return res.status(404).json({ error: "Company not found" });

    const count = await Profile.countDocuments({ company_id: ctx.companyId });
    if (count >= company.max_agents) {
      return res.status(400).json({ error: `Team limit reached (${company.max_agents} max)` });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.trim().toLowerCase() });
    if (user) return res.status(400).json({ error: "User already exists" });

    // Create user
    user = await User.create({
      email: email.trim().toLowerCase(),
      password,
      rawUserMetaData: { full_name: fullName.trim(), role },
      emailConfirmed: true,
    });

    // Create profile
    const profile = await Profile.create({
      user_id: user._id.toString(),
      full_name: fullName.trim(),
      email: user.email,
      role,
      company_id: ctx.companyId,
    });

    return res.status(201).json({ success: true, user_id: user._id });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── UPDATE MEMBER ───
app.patch("/team-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== "boolean") return res.status(400).json({ error: "No valid fields to update" });

  try {
    const member = await Profile.findOne({ user_id: id, company_id: ctx.companyId });
    if (!member) return res.status(404).json({ error: "Member not found in your company" });

    member.is_active = is_active;
    await member.save();

    return res.json(member);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.TEAM_API_PORT || 8088);
app.listen(port, () => console.log(`[team-api] listening on ${port}`));
