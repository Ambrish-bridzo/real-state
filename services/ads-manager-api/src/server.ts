import "dotenv/config";
import express from "express";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { UserAdsCredentials } from "../../../shared/src/models/ads_credentials";
import { encrypt } from "../../../shared/src/encryption";
import { AdsManagerService } from "./modules/manager/AdsManagerService";

const app = express();
app.use(express.json());

connectDB();

app.get("/health", (_req, res) => res.json({ status: "ok", service: "ads-manager-api" }));

// Auth Middleware
app.use(async (req: any, res, next) => {
  if (req.path === "/health") return next();
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });
  req.context = ctx;
  next();
});

// Settings - Save Credentials
app.post("/ads-manager-api/api/ads/settings", async (req: any, res) => {
  const { facebook, google } = req.body;
  const { userId, companyId } = req.context;

  const encryptedFB = facebook ? encrypt(JSON.stringify(facebook)) : null;
  const encryptedGoogle = google ? encrypt(JSON.stringify(google)) : null;

  try {
    const data = await UserAdsCredentials.findOneAndUpdate(
      { company_id: companyId, user_id: userId },
      {
        facebook_credentials: encryptedFB,
        google_credentials: encryptedGoogle,
        is_facebook_connected: !!facebook,
        is_google_connected: !!google,
      },
      { upsert: true, new: true }
    );
    return res.json({ message: "Settings saved successfully", connected: { facebook: !!facebook, google: !!google } });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Unified Ads API
app.get("/ads-manager-api/api/ads/campaigns", async (req: any, res) => {
  const { platform, accountId } = req.query;
  const { userId, companyId } = req.context;

  if (!platform || !accountId) {
    return res.status(400).json({ error: "Platform and accountId are required" });
  }

  try {
    const service = new AdsManagerService(userId, companyId);
    const campaigns = await service.getCampaigns(platform as any, accountId as string);
    return res.json({ campaigns });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/ads-manager-api/api/ads/create", async (req: any, res) => {
  const { platform, campaignName, budget, targeting, creatives, externalAccountId } = req.body;
  const { userId, companyId } = req.context;

  try {
    const service = new AdsManagerService(userId, companyId);
    const result = await service.createCampaign({
      platform,
      campaignName,
      budget,
      targeting,
      creatives,
      externalAccountId
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/ads-manager-api/api/ads/status", async (req: any, res) => {
  const { platform, campaignId, status } = req.body;
  const { userId, companyId } = req.context;

  try {
    const service = new AdsManagerService(userId, companyId);
    const result = await service.updateCampaignStatus(platform, campaignId, status);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/ads-manager-api/api/ads/analytics", async (req: any, res) => {
  const { userId, companyId } = req.context;

  try {
    const service = new AdsManagerService(userId, companyId);
    const analytics = await service.getAnalytics();
    return res.json(analytics);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/ads-manager-api/api/ads/adsets", async (req: any, res) => {
  const { userId, companyId } = req.context;
  try {
    const service = new AdsManagerService(userId, companyId);
    const { platform, campaignId } = req.query;
    const data = await service.getAdSets(platform as any, campaignId as string);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/ads-manager-api/api/ads/ad/create", async (req: any, res) => {
  const { userId, companyId } = req.context;
  try {
    const service = new AdsManagerService(userId, companyId);
    const data = await service.createAd(req.body);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/ads-manager-api/api/ads/internal/sync", async (req: any, res) => {
  try {
    const users = await UserAdsCredentials.find({
      $or: [{ is_facebook_connected: true }, { is_google_connected: true }]
    });

    if (users) {
      for (const user of users) {
        const service = new AdsManagerService(user.user_id, user.company_id);
        await service.syncCampaigns();
      }
    }
    return res.json({ success: true, message: "Sync started" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

const port = Number(process.env.ADS_MANAGER_PORT || 8115);
app.listen(port, () => console.log(`[ads-manager-api] listening on ${port}`));
