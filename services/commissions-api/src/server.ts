import "dotenv/config";
import express from "express";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { Commission } from "../../../shared/src/models/commission";

const app = express();
app.use(express.json());

connectDB();

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "commissions-api" }));

// ─── MIDDLEWARE: AUTH ───
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === "/health") return next();
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });
  (req as any).context = ctx;
  next();
});

// ─── COMMISSIONS ───
app.get("/commissions-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const filter: any = { company_id: ctx.companyId };
  if (ctx.role === "agent") filter.agent_id = ctx.userId;

  try {
    const commissions = await Commission.find(filter).sort({ createdAt: -1 });
    return res.json({ commissions });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/commissions-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  if (!["broker", "super_admin"].includes(ctx.role)) return res.status(403).json({ error: "Managers only" });

  const body = req.body;
  try {
    const commission = await Commission.create({
      ...body,
      company_id: ctx.companyId
    });
    return res.status(201).json(commission);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.COMMISSIONS_API_PORT || 8122);
app.listen(port, () => console.log(`[commissions-api] listening on ${port}`));
