import "dotenv/config";
import express from "express";


const app = express();
app.use(express.json());

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "sync-worker" }));

// Simplified sync worker loop could be here, or triggered by API
app.post("/sync-worker/process", async (req: express.Request, res: express.Response) => {
    console.log("[sync-worker] processing jobs...");
    // Trigger Ads Sync
    try {
        const adsManagerUrl = process.env.ADS_MANAGER_URL || `http://localhost:${process.env.ADS_MANAGER_PORT || 8115}`;
        await fetch(`${adsManagerUrl}/api/ads/internal/sync`, { method: 'POST' });
        console.log("[sync-worker] triggered ads sync");
    } catch (err) {
        console.error("[sync-worker] failed to trigger ads sync:", err);
    }
    return res.json({ status: "processing" });
});

// Run every 30 minutes
setInterval(async () => {
    console.log("[sync-worker] running scheduled sync...");
    try {
        const adsManagerUrl = process.env.ADS_MANAGER_URL || `http://localhost:${process.env.ADS_MANAGER_PORT || 8115}`;
        await fetch(`${adsManagerUrl}/api/ads/internal/sync`, { method: 'POST' });
    } catch (err) {
        console.error("[sync-worker] scheduled ads sync failed:", err);
    }
}, 30 * 60 * 1000);


const port = Number(process.env.SYNC_WORKER_PORT || 8104);
app.listen(port, () => console.log(`[sync-worker] listening on ${port}`));
