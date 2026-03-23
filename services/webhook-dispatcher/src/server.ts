import "dotenv/config";
import express from "express";
import crypto from "crypto";
import axios from "axios";
import { connectDB } from "../../../shared/src/mongodb";
import { WebhookEndpoint } from "../../../shared/src/models/webhook";
import { WebhookLog } from "../../../shared/src/models/webhook_log";

const app = express();
app.use(express.json());

connectDB();

function signPayload(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "webhook-dispatcher" }));

app.post("/webhook-dispatcher/dispatch", async (req: express.Request, res: express.Response) => {
  const { company_id, event_type, payload } = req.body;
  if (!company_id || !event_type || !payload) return res.status(400).json({ error: "missing fields" });

  const endpoints = await WebhookEndpoint.find({ company_id: company_id, is_active: true });
  const results = [];

  for (const ep of endpoints || []) {
    if (ep.events.includes(event_type) || ep.events.includes("*")) {
      const startTime = Date.now();
      const body = JSON.stringify({
        id: crypto.randomUUID(),
        event: event_type,
        created_at: new Date().toISOString(),
        data: payload
      });
      const signature = signPayload(body, ep.secret);

      try {
        const response = await axios.post(ep.url, body, {
          headers: {
            "Content-Type": "application/json",
            "X-Leadflow-Signature": signature,
            "X-Leadflow-Event": event_type,
          },
          timeout: 5000,
        });

        const duration = Date.now() - startTime;

        await WebhookLog.create({
          webhook_id: String(ep._id),
          company_id: company_id,
          event_type: event_type,
          payload: payload,
          request_headers: { "X-Leadflow-Signature": signature, "X-Leadflow-Event": event_type },
          response_status: response.status,
          response_body: typeof response.data === 'string' ? response.data.substring(0, 1000) : JSON.stringify(response.data).substring(0, 1000),
          duration_ms: duration,
        });

        results.push({ url: ep.url, status: response.status });
      } catch (error: any) {
        const duration = Date.now() - startTime;
        await WebhookLog.create({
          webhook_id: String(ep._id),
          company_id: company_id,
          event_type: event_type,
          payload: payload,
          error: error.message,
          response_status: error.response?.status,
          response_body: error.response?.data ? (typeof error.response.data === 'string' ? error.response.data.substring(0, 1000) : JSON.stringify(error.response.data).substring(0, 1000)) : undefined,
          duration_ms: duration,
        });
        results.push({ url: ep.url, error: error.message });
      }
    }
  }

  return res.json({ status: "processed", results });
});

const port = Number(process.env.WEBHOOK_DISPATCHER_PORT || 8103);
app.listen(port, () => console.log(`[webhook-dispatcher] listening on ${port}`));
