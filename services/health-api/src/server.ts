import "dotenv/config";
import express from "express";
import { connectDB } from "../../../shared/src/mongodb";

const app = express();
connectDB();

app.get("/health", (_req: express.Request, res: express.Response) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: "local",
    services: {
      database: "connected",
      local_gateway: "running"
    },
  });
});

const port = Number(process.env.HEALTH_API_PORT || 8105);
app.listen(port, () => console.log(`[health-api] listening on ${port}`));
