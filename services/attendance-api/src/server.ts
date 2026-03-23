import "dotenv/config";
import express from "express";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { Attendance } from "../../../shared/src/models/meeting_attendance";
import { SiteVisit } from "../../../shared/src/models/site_visit";

const app = express();
app.use(express.json());

connectDB();

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "attendance-api" }));

// ─── MIDDLEWARE: AUTH ───
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === "/health") return next();
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });
  (req as any).context = ctx;
  next();
});

// ─── ATTENDANCE ───
app.get("/attendance-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const filter: any = { company_id: ctx.companyId };

  if (ctx.role === "agent") filter.user_id = ctx.userId;
  else if (req.query.user_id) filter.user_id = req.query.user_id;

  try {
    const attendance = await Attendance.find(filter).sort({ clock_in: -1 }).limit(200);
    return res.json({ attendance });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/attendance-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { lat, lng, notes } = req.body;

  try {
    const attendance = await Attendance.create({
      user_id: ctx.userId,
      company_id: ctx.companyId,
      clock_in_lat: lat ?? null,
      clock_in_lng: lng ?? null,
      notes: notes ?? null,
    });
    return res.status(201).json(attendance);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch("/attendance-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;
  const { lat, lng } = req.body;

  try {
    const attendance = await Attendance.findOneAndUpdate(
      { _id: id, user_id: ctx.userId },
      {
        clock_out: new Date(),
        clock_out_lat: lat ?? null,
        clock_out_lng: lng ?? null,
      },
      { new: true }
    );
    if (!attendance) return res.status(404).json({ error: "Attendance record not found" });
    return res.json(attendance);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── SITE VISITS ───
app.get("/attendance-api/site-visits", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const filter: any = { company_id: ctx.companyId };
  if (ctx.role === "agent") filter.user_id = ctx.userId;

  try {
    const siteVisits = await SiteVisit.find(filter).sort({ visit_date: -1 }).limit(200);
    return res.json({ site_visits: siteVisits });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/attendance-api/site-visits", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const body = req.body;
  if (!body.property_name) return res.status(400).json({ error: "property_name required" });

  try {
    const siteVisit = await SiteVisit.create({
      ...body,
      user_id: ctx.userId,
      company_id: ctx.companyId,
    });
    return res.status(201).json(siteVisit);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.ATTENDANCE_API_PORT || 8093);
app.listen(port, () => console.log(`[attendance-api] listening on ${port}`));
