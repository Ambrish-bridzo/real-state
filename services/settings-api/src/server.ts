import "dotenv/config";
import express from "express";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { Profile, Company } from "../../../shared/src/models/company_profile";
import { User } from "../../../shared/src/models/user";
import { CommunicationConfig } from "../../../shared/src/models/communication";
import { encrypt, decrypt } from "../../../shared/src/encryption";
import { generateTotpSecret, getOtpAuthUrl, verifyTotpToken } from "../../../shared/src/totp";
import { generateRecoveryCodes, hashValue } from "../../../shared/src/security";

const app = express();
app.use(express.json());

connectDB();

async function hasEmailChannelConfigured(companyId?: string | null) {
  if (!companyId) return false;

  const config = await CommunicationConfig.findOne({
    company_id: companyId,
    type: "email",
    is_active: true,
  });

  return Boolean(
    config?.config?.email &&
    config?.config?.smtp_host &&
    config?.config?.smtp_port &&
    config?.config?.smtp_user &&
    config?.config?.smtp_password
  );
}

function isTeamPolicyAdmin(role: string) {
  return ["broker", "owner", "super_admin"].includes(role);
}

function isPolicyLocked(role: string, company?: { enforce_team_two_factor?: boolean } | null) {
  return Boolean(company?.enforce_team_two_factor && !isTeamPolicyAdmin(role));
}

function buildSecurityResponse({
  user,
  company,
  role,
  emailChannelConfigured,
}: {
  user: any;
  company?: any;
  role: string;
  emailChannelConfigured: boolean;
}) {
  const twoFactorLockedByPolicy = isPolicyLocked(role, company);

  return {
    two_factor_enabled: Boolean(user.twoFactorEnabled || twoFactorLockedByPolicy),
    two_factor_method: user.twoFactorMethod,
    two_factor_locked_by_policy: twoFactorLockedByPolicy,
    company_two_factor_required: Boolean(company?.enforce_team_two_factor),
    login_notifications_enabled: user.loginNotificationsEnabled,
    email_channel_configured: emailChannelConfigured,
    authenticator_configured: Boolean(user.twoFactorSecret),
    trusted_devices_count: (user.trustedDevices || []).filter((device: any) => device.expiresAt > new Date()).length,
    recovery_codes_available: (user.recoveryCodeHashes || []).length,
  };
}

function replaceRecoveryCodes(user: any) {
  const recoveryCodes = generateRecoveryCodes();
  user.recoveryCodeHashes = recoveryCodes.map((code) => hashValue(code));
  return recoveryCodes;
}

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "settings-api" }));

// ─── MIDDLEWARE: AUTH ───
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === "/health") return next();

  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });

  (req as any).context = ctx;
  next();
});

// ─── PROFILE ───
app.get("/settings-api/profile", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  try {
    const profile = await Profile.findOne({ user_id: ctx.userId });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    return res.json(profile);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch("/settings-api/profile", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const body = req.body;
  const ALLOWED = ["full_name", "phone", "avatar_url"];
  const updates: Record<string, any> = {};
  for (const f of ALLOWED) if (body[f] !== undefined) updates[f] = body[f];

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No valid fields" });

  try {
    const profile = await Profile.findOneAndUpdate({ user_id: ctx.userId }, updates, { new: true });
    return res.json(profile);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── COMPANY ───
app.get("/settings-api/company", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  if (!ctx.companyId) return res.status(404).json({ error: "No company" });
  try {
    const company = await Company.findById(ctx.companyId);
    if (!company) return res.status(404).json({ error: "Company not found" });
    return res.json(company);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch("/settings-api/company", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  if (!ctx.companyId) return res.status(404).json({ error: "No company" });
  if (!["broker", "super_admin", "owner"].includes(ctx.role)) return res.status(403).json({ error: "Admins only" });

  const body = req.body;
  const ALLOWED = ["name", "email", "phone", "website", "address", "city", "rera_license", "logo_url", "plan", "plan_id"];
  const updates: Record<string, any> = {};
  for (const f of ALLOWED) if (body[f] !== undefined) updates[f] = body[f];

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No valid fields" });

  try {
    const company = await Company.findByIdAndUpdate(ctx.companyId, updates, { new: true });
    return res.json(company);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── PASSWORD ───
app.post("/settings-api/change-password", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { password } = req.body;
  if (!password || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 chars" });

  try {
    const user = await User.findById(ctx.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.password = password;
    await user.save(); // Pre-save hook will hash it

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── SECURITY ───
app.get("/settings-api/security", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;

  try {
    const [user, company] = await Promise.all([
      User.findById(ctx.userId),
      ctx.companyId ? Company.findById(ctx.companyId) : Promise.resolve(null),
    ]);
    if (!user) return res.status(404).json({ error: "User not found" });

    const emailChannelConfigured = await hasEmailChannelConfigured(ctx.companyId);
    return res.json(buildSecurityResponse({ user, company, role: ctx.role, emailChannelConfigured }));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch("/settings-api/security", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { login_notifications_enabled, company_two_factor_required } = req.body;

  try {
    const [user, company] = await Promise.all([
      User.findById(ctx.userId),
      ctx.companyId ? Company.findById(ctx.companyId) : Promise.resolve(null),
    ]);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (typeof login_notifications_enabled === "boolean") {
      user.loginNotificationsEnabled = login_notifications_enabled;
    }

    if (typeof company_two_factor_required === "boolean") {
      if (!company || !isTeamPolicyAdmin(ctx.role)) {
        return res.status(403).json({ error: "Only broker or owner can manage team-wide 2FA" });
      }
      company.enforce_team_two_factor = company_two_factor_required;
      await company.save();
    }

    await user.save();

    const emailChannelConfigured = await hasEmailChannelConfigured(ctx.companyId);
    return res.json(buildSecurityResponse({ user, company, role: ctx.role, emailChannelConfigured }));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/settings-api/security/2fa/setup", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const method = req.body?.method === "email" ? "email" : "authenticator";
  const applyToTeam = Boolean(req.body?.apply_to_team);

  try {
    const [user, company] = await Promise.all([
      User.findById(ctx.userId),
      ctx.companyId ? Company.findById(ctx.companyId) : Promise.resolve(null),
    ]);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (method === "email") {
      const emailChannelConfigured = await hasEmailChannelConfigured(ctx.companyId);
      if (!emailChannelConfigured) {
        return res.status(400).json({ error: "Email channel is not configured. Use authenticator app instead." });
      }

      user.twoFactorEnabled = true;
      user.twoFactorMethod = "email";
      user.twoFactorSecret = null;
      user.twoFactorTempSecret = null;
      user.twoFactorCodeHash = null;
      user.twoFactorCodeExpiresAt = null;
      const recoveryCodes = replaceRecoveryCodes(user);
      await user.save();

      if (applyToTeam && company && isTeamPolicyAdmin(ctx.role)) {
        company.enforce_team_two_factor = true;
        await company.save();
      }

      return res.json({
        success: true,
        two_factor_enabled: true,
        two_factor_method: "email",
        recovery_codes: recoveryCodes,
      });
    }

    const secret = generateTotpSecret();
    user.twoFactorTempSecret = encrypt(secret);
    await user.save();

    return res.json({
      success: true,
      method: "authenticator",
      secret,
      otpauth_url: getOtpAuthUrl({
        accountName: user.email,
        secret,
        issuer: "BridzoLead",
      }),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/settings-api/security/2fa/verify", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const code = String(req.body?.code || "");
  const applyToTeam = Boolean(req.body?.apply_to_team);

  try {
    const [user, company] = await Promise.all([
      User.findById(ctx.userId),
      ctx.companyId ? Company.findById(ctx.companyId) : Promise.resolve(null),
    ]);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.twoFactorTempSecret) return res.status(400).json({ error: "No authenticator setup in progress" });

    const secret = decrypt(user.twoFactorTempSecret);
    if (!verifyTotpToken(secret, code)) {
      return res.status(400).json({ error: "Invalid authenticator code" });
    }

    user.twoFactorEnabled = true;
    user.twoFactorMethod = "authenticator";
    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = null;
    user.twoFactorCodeHash = null;
    user.twoFactorCodeExpiresAt = null;
    const recoveryCodes = replaceRecoveryCodes(user);
    await user.save();

    if (applyToTeam && company && isTeamPolicyAdmin(ctx.role)) {
      company.enforce_team_two_factor = true;
      await company.save();
    }

    const emailChannelConfigured = await hasEmailChannelConfigured(ctx.companyId);
    return res.json({
      success: true,
      ...buildSecurityResponse({ user, company, role: ctx.role, emailChannelConfigured }),
      recovery_codes: recoveryCodes,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/settings-api/security/2fa/disable", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const applyToTeam = Boolean(req.body?.apply_to_team);

  try {
    const [user, company] = await Promise.all([
      User.findById(ctx.userId),
      ctx.companyId ? Company.findById(ctx.companyId) : Promise.resolve(null),
    ]);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (isPolicyLocked(ctx.role, company)) return res.status(403).json({ error: "2FA is required by your broker and cannot be disabled." });

    user.twoFactorEnabled = false;
    user.twoFactorMethod = null;
    user.twoFactorSecret = null;
    user.twoFactorTempSecret = null;
    user.twoFactorCodeHash = null;
    user.twoFactorCodeExpiresAt = null;
    user.recoveryCodeHashes = [];
    user.trustedDevices = [];
    await user.save();

    if (applyToTeam && company && isTeamPolicyAdmin(ctx.role)) {
      company.enforce_team_two_factor = false;
      await company.save();
    }

    const emailChannelConfigured = await hasEmailChannelConfigured(ctx.companyId);
    return res.json({ success: true, ...buildSecurityResponse({ user, company, role: ctx.role, emailChannelConfigured }) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/settings-api/security/recovery-codes/regenerate", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;

  try {
    const user = await User.findById(ctx.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!(user.twoFactorEnabled || user.twoFactorSecret)) {
      return res.status(400).json({ error: "Enable 2FA before generating recovery codes" });
    }

    const recoveryCodes = replaceRecoveryCodes(user);
    await user.save();

    return res.json({ success: true, recovery_codes: recoveryCodes });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/settings-api/security/trusted-devices/revoke", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;

  try {
    const user = await User.findById(ctx.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.trustedDevices = [];
    await user.save();

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.SETTINGS_API_PORT || 8089);
app.listen(port, () => console.log(`[settings-api] listening on ${port}`));
