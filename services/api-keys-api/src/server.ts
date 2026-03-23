import "dotenv/config";
import express from "express";
import crypto from "crypto";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { ApiKey } from "../../../shared/src/models/api_key";

const app = express();
app.use(express.json());

connectDB();

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "api-keys-api" }));

// ─── MIDDLEWARE: AUTH ───
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === "/health") return next();
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });
  if (!["broker", "super_admin"].includes(ctx.role)) return res.status(403).json({ error: "Managers only" });
  (req as any).context = ctx;
  next();
});

// ─── API KEYS ───
app.get("/api-keys-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  try {
    const keys = await ApiKey.find({ company_id: ctx.companyId }, 'id name key_prefix scopes is_active created_at');
    return res.json({ api_keys: keys });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api-keys-api", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const body = req.body;

  const rawKey = "blk_" + crypto.randomBytes(32).toString("hex");
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 12);

  try {
    const apiKey = await ApiKey.create({
      company_id: ctx.companyId,
      created_by: ctx.userId,
      name: body.name || "Default",
      scopes: body.scopes || ["leads.read"],
      key_hash: keyHash,
      key_prefix: keyPrefix,
      is_active: true,
    });

    return res.status(201).json({
      id: apiKey._id,
      name: apiKey.name,
      key_prefix: apiKey.key_prefix,
      scopes: apiKey.scopes,
      is_active: apiKey.is_active,
      created_at: apiKey.createdAt,
      raw_key: rawKey
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.API_KEYS_API_PORT || 8100);
app.listen(port, () => console.log(`[api-keys-api] listening on ${port}`));
