import "dotenv/config";
import express from "express";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { Task } from "../../../shared/src/models/task";
import { Profile } from "../../../shared/src/models/company_profile";
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
    }).catch((error) => console.error(`[tasks-api] notification dispatch failed: ${error.message}`));
  } catch (_error) {
    // Ignore notification failures to avoid blocking task operations
  }
}

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "tasks-api" }));

// ─── MIDDLEWARE: AUTH ───
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === "/health") return next();
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });
  (req as any).context = ctx;
  next();
});

// ─── LIST TASKS ───
app.get("/tasks-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const filter: any = { company_id: ctx.companyId };

  const status = req.query.status as string;
  const assignedTo = req.query.assigned_to as string;
  if (status) filter.status = status;
  if (assignedTo) filter.assigned_to = assignedTo;

  const limit = Math.min(parseInt(String(req.query.limit || "100"), 10), 500);
  const page = Math.max(parseInt(String(req.query.page || "1"), 10), 1);

  try {
    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Manually join profile for assigned_to_name
    const taskList = await Promise.all(tasks.map(async (t) => {
      const profile = await Profile.findOne({ user_id: t.assigned_to });
      return {
        ...t.toObject(),
        assigned_to_name: profile ? profile.full_name : null
      };
    }));

    return res.json({ tasks: taskList });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── GET SINGLE TASK ───
app.get("/tasks-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;
  try {
    const task = await Task.findOne({ _id: id, company_id: ctx.companyId });
    if (!task) return res.status(404).json({ error: "Task not found" });
    return res.json(task);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── CREATE TASK ───
app.post("/tasks-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const body = req.body;
  if (!body.title) return res.status(400).json({ error: "title is required" });

  try {
    const task = await Task.create({
      company_id: ctx.companyId,
      title: body.title,
      description: body.description ?? null,
      priority: body.priority || "medium",
      status: "pending",
      assigned_to: body.assigned_to || ctx.userId,
      created_by: ctx.userId,
      lead_id: body.lead_id || null,
      scheduled_at: body.scheduled_at || null,
      due_date: body.due_date || null,
      metadata: body.metadata || {},
    });

    if (task.assigned_to) {
      sendNotification({
        company_id: ctx.companyId,
        user_id: task.assigned_to,
        type: "task_assigned",
        title: "New task assigned",
        message: `${task.title} has been assigned to you.`,
        entity_type: "task",
        entity_id: task._id.toString(),
        link_url: "/tasks",
        metadata: {
          priority: task.priority,
          due_date: task.due_date,
        },
      });
    }

    return res.status(201).json(task);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── UPDATE TASK ───
app.patch("/tasks-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;
  const body = req.body;

  const updates: any = {};
  const allowed = ["title", "description", "priority", "status", "assigned_to", "scheduled_at", "due_date"];
  for (const f of allowed) if (body[f] !== undefined) updates[f] = body[f];

  if (updates.status === "completed") updates.completed_at = new Date();

  try {
    const existingTask = await Task.findOne({ _id: id, company_id: ctx.companyId });
    if (!existingTask) return res.status(404).json({ error: "Task not found" });

    const task = await Task.findOneAndUpdate(
      { _id: id, company_id: ctx.companyId },
      updates,
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (updates.assigned_to && updates.assigned_to !== existingTask.assigned_to) {
      sendNotification({
        company_id: ctx.companyId,
        user_id: updates.assigned_to,
        type: "task_assigned",
        title: "Task assigned to you",
        message: `${task.title} is now assigned to you.`,
        entity_type: "task",
        entity_id: task._id.toString(),
        link_url: "/tasks",
        metadata: {
          priority: task.priority,
          due_date: task.due_date,
        },
      });
    }

    return res.json(task);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── DELETE TASK ───
app.delete("/tasks-api/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;
  if (!["broker", "team_lead", "super_admin"].includes(ctx.role)) return res.status(403).json({ error: "Managers only" });

  try {
    const result = await Task.deleteOne({ _id: id, company_id: ctx.companyId });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Task not found" });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.TASKS_API_PORT || 8090);
app.listen(port, () => console.log(`[tasks-api] listening on ${port}`));
