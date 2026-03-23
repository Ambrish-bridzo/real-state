import "dotenv/config";
import express from "express";
import { z } from "zod";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "outgoing-adapter" }));

const requestSchema = z.object({
  provider: z.string().min(1),
  operation: z.string().min(1),
  payload: z.record(z.any()).optional(),
});

app.post("/outgoing/dispatch", (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // Adapter boundary: integrate with Twilio/Meta/Resend/etc from here only.
  return res.json({
    accepted: true,
    provider: parsed.data.provider,
    operation: parsed.data.operation,
    message: "Outgoing request accepted by adapter service",
  });
});

const port = Number(process.env.OUTGOING_PORT || 8083);
app.listen(port, () => console.log(`[outgoing-adapter] listening on ${port}`));
