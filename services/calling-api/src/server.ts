import "dotenv/config";
import express from "express";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { Call } from "../../../shared/src/models/call";

const app = express();
app.use(express.json());

connectDB();

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "calling-api" }));

// ─── MIDDLEWARE: AUTH ───
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === "/health") return next();
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });
  (req as any).context = ctx;
  next();
});

// ─── CALLS ───
app.get("/calling-api/calls", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  try {
    const calls = await Call.find({ company_id: ctx.companyId }).sort({ createdAt: -1 });
    return res.json({ calls });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/calling-api/outbound/manual", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const body = req.body;
  if (!body.to_number || !body.from_number) return res.status(400).json({ error: "numbers required" });

  try {
    const call = await Call.create({
      company_id: ctx.companyId,
      direction: "outbound",
      call_type: "manual",
      status: "ringing",
      from_number: body.from_number,
      to_number: body.to_number,
      lead_id: body.lead_id || null,
      assigned_to: ctx.userId,
      started_at: new Date(),
    });
    return res.status(201).json(call);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.CALLING_API_PORT || 8101);
app.listen(port, () => console.log(`[calling-api] listening on ${port}`));
