import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { Profile, Company } from "../../../shared/src/models/company_profile";
import { AuditLog } from "../../../shared/src/models/audit_log";
import { Plan } from "../../../shared/src/models/lead_plan";
import { Notification } from "../../../shared/src/models/notification";

import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: "/core/socket.io",
  cors: { origin: process.env.CORS_ORIGIN || "*", methods: ["GET", "POST"] }
});
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || "leadflow-internal-token-2026";
const notificationClients = new Map<string, Set<express.Response>>();

function addNotificationClient(userId: string, res: express.Response) {
  const clients = notificationClients.get(userId) || new Set<express.Response>();
  clients.add(res);
  notificationClients.set(userId, clients);
}

function removeNotificationClient(userId: string, res: express.Response) {
  const clients = notificationClients.get(userId);
  if (!clients) return;

  clients.delete(res);
  if (clients.size === 0) {
    notificationClients.delete(userId);
  }
}

function writeSseEvent(res: express.Response, event: string, payload: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function broadcastNotification(notification: Record<string, unknown> & { user_id?: string | null }) {
  if (!notification.user_id) return;

  const clients = notificationClients.get(notification.user_id);
  if (!clients || clients.size === 0) return;

  for (const client of clients) {
    writeSseEvent(client, "notification", notification);
  }
}

connectDB().then(() => {
  console.log("[core-engine] Connected to MongoDB. Setting up Change Streams...");

  // ─── MONGODB CHANGE STREAM BRIDGE ───
  // Note: Change Streams require a Replica Set. Falling back gracefully if not available.
  const setupChangeStreams = async () => {
    try {
      if (!mongoose.connection.db) {
        console.warn("[core-engine] Database connection not ready. Real-time logs disabled.");
        return;
      }
      const admin = mongoose.connection.db.admin();
      const status = await admin.serverStatus();

      if (!status.repl) {
        console.warn("[core-engine] Standalone MongoDB detected. Change Streams disabled (Real-time logs will not be broadcast).");
        return;
      }

      console.log("[core-engine] Replica Set detected. Initiating Change Streams...");
      const auditLogStream = AuditLog.watch();
      auditLogStream.on("change", async (change) => {
        if (change.operationType === "insert") {
          const newLog = change.fullDocument;
          console.log("[core-engine] broadcasting new audit log via socket:", newLog._id);

          try {
            const [profile, company] = await Promise.all([
              Profile.findOne({ user_id: newLog.user_id }).select("email full_name role"),
              Company.findById(newLog.company_id).select("name")
            ]);

            io.emit("audit_log_created", {
              ...newLog,
              actor: profile || null,
              company_name: company?.name || null
            });
          } catch (err) {
            console.error("[core-engine] Error enriching audit log:", err);
          }
        }
      });

      auditLogStream.on("error", (err) => {
        console.warn("[core-engine] Change Stream runtime error:", err.message);
        auditLogStream.close();
      });
    } catch (err: any) {
      console.warn("[core-engine] Could not verify Replica Set. Falling back to disabled Change Streams.");
    }
  };

  setupChangeStreams();
}).catch(console.error);

io.on("connection", (socket) => {
  console.log(`[core-engine] client connected to socket: ${socket.id}`);
  socket.on("disconnect", () => console.log(`[core-engine] client disconnected: ${socket.id}`));
});

app.get("/health", (_req, res) => res.json({ status: "ok", service: "core-engine" }));

app.get("/core/profile", async (req, res) => {
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });

  try {
    const profile = await Profile.findOne({ user_id: ctx.userId });
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    return res.json({ profile: { ...profile.toObject(), role: ctx.role } });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Basic feature check logic
app.post("/core/features/check", async (req, res) => {
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });

  const parsed = z.object({ feature_keys: z.array(z.string().min(1)).min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const company = await Company.findById(ctx.companyId);
    if (!company) return res.status(404).json({ error: "Company not found" });

    const plan = await Plan.findOne({ name: company.plan });

    const checks: Record<string, boolean> = {};
    for (const key of parsed.data.feature_keys) {
      // Simplified: Allow all features for now, or check plan name
      checks[key] = true;
    }

    return res.json({ features: checks });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/core/audit-logs", async (req, res) => {
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });

  const limit = Math.min(Math.max(parseInt(String(req.query.limit || "20"), 10), 1), 100);
  const page = Math.max(parseInt(String(req.query.page || "1"), 10), 1);

  try {
    const filter: any = {};
    if (ctx.role === "owner" || ctx.role === "super_admin") {
      const qCompanyId = String(req.query.company_id || "");
      if (qCompanyId) filter.company_id = qCompanyId;
    } else if (ctx.role === "broker" || ctx.role === "team_lead") {
      filter.company_id = ctx.companyId;
    } else {
      filter.user_id = ctx.userId;
    }

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const enrichedLogs = await Promise.all(logs.map(async (log) => {
      const [profile, company] = await Promise.all([
        Profile.findOne({ user_id: log.user_id }).select("id email full_name role"),
        Company.findById(log.company_id).select("id name")
      ]);
      return {
        ...log.toObject(),
        actor: profile || null,
        company_name: company?.name || null
      };
    }));

    return res.json({ logs: enrichedLogs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/core/notifications", async (req, res) => {
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });

  const limit = Math.min(Math.max(parseInt(String(req.query.limit || "20"), 10), 1), 50);

  try {
    const notifications = await Notification.find({
      $or: [
        { user_id: ctx.userId },
        { company_id: ctx.companyId, user_id: null },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({ notifications });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/core/notifications/stream", async (req, res) => {
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  addNotificationClient(ctx.userId, res);
  writeSseEvent(res, "connected", { user_id: ctx.userId, at: new Date().toISOString() });

  const heartbeat = setInterval(() => {
    writeSseEvent(res, "ping", { at: new Date().toISOString() });
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeNotificationClient(ctx.userId, res);
    res.end();
  });
});

app.post("/core/notifications/read-all", async (req, res) => {
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });

  try {
    await Notification.updateMany(
      {
        user_id: ctx.userId,
        read_at: null,
      },
      {
        $set: { read_at: new Date() },
      }
    );

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/core/internal/notify", async (req, res) => {
  const internalToken = req.headers["x-internal-token"];
  if (internalToken !== INTERNAL_SERVICE_TOKEN) {
    return res.status(401).json({ error: "Unauthorized internal request" });
  }

  const parsed = z.object({
    company_id: z.string().min(1),
    user_id: z.string().min(1).nullable().optional(),
    type: z.string().min(1).default("info"),
    title: z.string().min(1),
    message: z.string().min(1),
    entity_type: z.string().min(1).nullable().optional(),
    entity_id: z.string().min(1).nullable().optional(),
    link_url: z.string().min(1).nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const notification = await Notification.create({
      company_id: parsed.data.company_id,
      user_id: parsed.data.user_id ?? null,
      type: parsed.data.type,
      title: parsed.data.title,
      message: parsed.data.message,
      entity_type: parsed.data.entity_type ?? null,
      entity_id: parsed.data.entity_id ?? null,
      link_url: parsed.data.link_url ?? null,
      metadata: parsed.data.metadata || {},
    });

    const payload = notification.toObject();
    broadcastNotification(payload);

    return res.status(201).json({ notification: payload });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/core/internal/broadcast", async (req, res) => {
  const { event, payload } = req.body;
  if (!event || !payload) return res.status(400).json({ error: "Missing event or payload" });

  console.log(`[core-engine] Internal broadcast request for event: ${event}`);
  io.emit(event, payload);
  return res.json({ success: true });
});

const port = Number(process.env.CORE_PORT || 8082);
httpServer.listen(port, () => console.log(`[core-engine] listening on ${port} (Sockets enabled)`));
