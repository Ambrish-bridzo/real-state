import "dotenv/config";
import express from "express";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { Meeting } from "../../../shared/src/models/meeting_attendance";
import axios from "axios";

const app = express();
app.use(express.json());

connectDB();

const CORE_ENGINE_URL = process.env.CORE_ENGINE_URL || `http://localhost:${process.env.CORE_PORT || 8082}`;
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || "leadflow-internal-token-2026";

async function sendNotification(payload: {
  company_id: string;
  user_id?: string | null;
  type: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  link_url?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await axios.post(`${CORE_ENGINE_URL}/core/internal/notify`, payload, {
      headers: { "x-internal-token": INTERNAL_SERVICE_TOKEN },
    }).catch((error) => console.error(`[meetings-api] notification dispatch failed: ${error.message}`));
  } catch (_error) {
    // Ignore notification failures to avoid blocking meeting operations
  }
}

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "meetings-api" }));

// ─── MIDDLEWARE: AUTH ───
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === "/health") return next();
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });
  (req as any).context = ctx;
  next();
});

// ─── LIST MEETINGS ───
app.get("/meetings-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const filter: any = { company_id: ctx.companyId };

  const meetingType = req.query.meeting_type as string;
  const status = req.query.status as string;
  const assignedTo = req.query.assigned_to as string;
  if (meetingType) filter.meeting_type = meetingType;
  if (status) filter.status = status;
  if (assignedTo) filter.assigned_to = assignedTo;

  try {
    const meetings = await Meeting.find(filter).sort({ scheduled_at: 1 });
    return res.json({ meetings });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── STATS ───
app.get("/meetings-api/stats", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  try {
    const meetings = await Meeting.find({ company_id: ctx.companyId });
    const now = new Date();

    const countByStatus = (items: any[]) => ({
      total: items.length,
      done: items.filter(m => m.status === "done").length,
      not_done: items.filter(m => m.status === "not_done").length,
      overdue: items.filter(m => m.status === "overdue" || (m.status === "scheduled" && new Date(m.scheduled_at) < now)).length,
      scheduled: items.filter(m => m.status === "scheduled" && new Date(m.scheduled_at) >= now).length,
      uniqueLeads: new Set(items.filter(m => m.lead_id).map(m => m.lead_id)).size,
    });

    return res.json({
      meetings: countByStatus(meetings.filter(m => m.meeting_type === "meeting")),
      siteVisits: countByStatus(meetings.filter(m => m.meeting_type === "site_visit")),
      callbacks: countByStatus(meetings.filter(m => m.meeting_type === "callback")),
      upcoming: meetings.filter(m => m.status === "scheduled" && new Date(m.scheduled_at) >= now)
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
        .slice(0, 10),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── GET SINGLE MEETING ───
app.get("/meetings-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;
  try {
    const meeting = await Meeting.findOne({ _id: id, company_id: ctx.companyId });
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });
    return res.json(meeting);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── CREATE MEETING ───
app.post("/meetings-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const body = req.body;
  if (!body.title || !body.scheduled_at) return res.status(400).json({ error: "title and scheduled_at required" });

  try {
    const meeting = await Meeting.create({
      company_id: ctx.companyId,
      title: body.title,
      description: body.description ?? null,
      meeting_type: body.meeting_type || "meeting",
      status: "scheduled",
      lead_id: body.lead_id || null,
      lead_name: body.lead_name || null,
      assigned_to: body.assigned_to || ctx.userId,
      created_by: ctx.userId,
      scheduled_at: body.scheduled_at,
      location: body.location || null,
      notes: body.notes || null,
      metadata: body.metadata || {},
    });

    if (meeting.assigned_to) {
      sendNotification({
        company_id: ctx.companyId,
        user_id: meeting.assigned_to,
        type: "meeting_assigned",
        title: "New reminder scheduled",
        message: `${meeting.title} is scheduled for ${new Date(meeting.scheduled_at).toLocaleString("en-IN")}.`,
        entity_type: "meeting",
        entity_id: meeting._id.toString(),
        link_url: "/meetings",
        metadata: {
          meeting_type: meeting.meeting_type,
          scheduled_at: meeting.scheduled_at,
        },
      });
    }

    return res.status(201).json(meeting);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── UPDATE MEETING ───
app.patch("/meetings-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;
  const body = req.body;
  const updates: any = {};
  const allowed = ["title", "description", "status", "scheduled_at", "location", "notes", "assigned_to"];
  for (const f of allowed) if (body[f] !== undefined) updates[f] = body[f];

  if (updates.status === "done") updates.completed_at = new Date();

  try {
    const existingMeeting = await Meeting.findOne({ _id: id, company_id: ctx.companyId });
    if (!existingMeeting) return res.status(404).json({ error: "Meeting not found" });

    const meeting = await Meeting.findOneAndUpdate(
      { _id: id, company_id: ctx.companyId },
      updates,
      { new: true }
    );
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });

    if (body.assigned_to && body.assigned_to !== existingMeeting.assigned_to) {
      sendNotification({
        company_id: ctx.companyId,
        user_id: body.assigned_to,
        type: "meeting_assigned",
        title: "Meeting assigned to you",
        message: `${meeting.title} is now assigned to you.`,
        entity_type: "meeting",
        entity_id: meeting._id.toString(),
        link_url: "/meetings",
        metadata: {
          meeting_type: meeting.meeting_type,
          scheduled_at: meeting.scheduled_at,
        },
      });
    }

    return res.json(meeting);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── DELETE MEETING ───
app.delete("/meetings-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;
  if (!["broker", "team_lead", "super_admin"].includes(ctx.role)) return res.status(403).json({ error: "Managers only" });

  try {
    const result = await Meeting.deleteOne({ _id: id, company_id: ctx.companyId });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Meeting not found" });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.MEETINGS_API_PORT || 8091);
app.listen(port, () => console.log(`[meetings-api] listening on ${port}`));
