import "dotenv/config";
import express from "express";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { Message } from "../../../shared/src/models/communication";
import { AuditLog } from "../../../shared/src/models/audit_log";
import whatsappRoutes from "./routes/whatsapp.routes";
import emailRoutes from "./routes/email.routes";
import { WhatsAppController } from "./controllers/whatsapp.controller";
import { EmailController } from "./controllers/email.controller";
import { MediaController } from "./controllers/media.controller";

const app = express();
app.use(express.json());

connectDB();

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "communications-api" }));

// ─── AUTH MIDDLEWARE ───
async function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });

  // Feature check can be added here if needed, simplified for migration

  (req as any).context = ctx;
  next();
}

// ─── PUBLIC ROUTES ───
app.use("/communications-api/api/whatsapp", (req, res, next) => {
  if (req.path === "/webhook") return next();
  authMiddleware(req, res, next);
}, whatsappRoutes);

// ─── PROTECTED ROUTES ───
app.use("/communications-api/api/email", authMiddleware, emailRoutes);

app.get("/communications-api/api/whatsapp/config", authMiddleware, WhatsAppController.getConfig);
app.post("/communications-api/api/whatsapp/config", authMiddleware, WhatsAppController.saveConfig);
app.get("/communications-api/api/email/config", authMiddleware, EmailController.getConfig);
app.post("/communications-api/api/email/config", authMiddleware, EmailController.saveConfig);

app.post("/communications-api/media/upload", authMiddleware, MediaController.upload);

// Existing legacy endpoints
app.post("/communications-api/send", authMiddleware, async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const body = req.body;
  if (!body.content || !body.channel) return res.status(400).json({ error: "content and channel required" });

  try {
    const message = await Message.create({
      company_id: ctx.companyId,
      user_id: ctx.userId,
      lead_id: body.lead_id || null,
      content: body.content,
      channel: body.channel,
      direction: "outbound",
      status: "sent",
    });

    await AuditLog.create({
      user_id: ctx.userId,
      company_id: ctx.companyId,
      action: "send_message",
      entity_type: "message",
      entity_id: message._id.toString(),
    });

    return res.json({ message_id: message._id, status: "sent" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/communications-api/messages", authMiddleware, async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const filter: any = { company_id: ctx.companyId };
  if (req.query.lead_id) filter.lead_id = req.query.lead_id;

  try {
    const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(100);
    return res.json({ messages });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.COMMUNICATIONS_API_PORT || 8098);
app.listen(port, () => console.log(`[communications-api] listening on ${port}`));
