import "dotenv/config";
import express from "express";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "incoming-adapter" }));

app.post("/incoming/webhooks/:provider", (req, res) => {
  const provider = req.params.provider;

  // Incoming boundary: verify signature, normalize payload, enqueue for core-engine.
  // Signature validation intentionally belongs here, not in UI.
  return res.status(202).json({
    accepted: true,
    provider,
    received_at: new Date().toISOString(),
    message: "Incoming webhook accepted by adapter service",
  });
});

const port = Number(process.env.INCOMING_PORT || 8084);
app.listen(port, () => console.log(`[incoming-adapter] listening on ${port}`));
