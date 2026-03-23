import "dotenv/config";
import express from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { connectDB } from "../../../shared/src/mongodb";
import { User } from "../../../shared/src/models/user";
import { Profile, Company } from "../../../shared/src/models/company_profile";
import { Plan } from "../../../shared/src/models/lead_plan";
import { CommunicationConfig } from "../../../shared/src/models/communication";
import { decrypt, encrypt } from "../../../shared/src/encryption";
import { generateTotpSecret, getOtpAuthUrl, verifyTotpToken } from "../../../shared/src/totp";
import { generateRandomToken, hashValue } from "../../../shared/src/security";

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "leadflow-secret-key-2026";
const TEMP_LOGIN_SECRET = process.env.TEMP_LOGIN_SECRET || JWT_SECRET;

connectDB();

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(["owner", "super_admin", "broker", "team_lead", "agent"]).optional(),
});
const forgotPasswordSchema = z.object({ email: z.string().email() });
const resetPasswordSchema = z.object({
  token: z.string().min(8),
  password: z.string().min(8),
});
const verifyTwoFactorSchema = z.object({
  temp_token: z.string().min(10),
  code: z.string().trim().min(6).max(32),
  remember_device: z.boolean().optional(),
});

const onboardSchema = z.object({
  name: z.string().min(2),
  rera_license: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email(),
  website: z.string().optional().or(z.literal("")),
});

function buildAccessToken(user: { _id: string; email: string }) {
  return jwt.sign({ sub: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

function buildTempLoginToken(userId: string) {
  return jwt.sign({ sub: userId, purpose: "2fa" }, TEMP_LOGIN_SECRET, { expiresIn: "10m" });
}

function getClientIp(req: express.Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (Array.isArray(forwarded)) return forwarded[0];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

async function getEmailConfig(companyId?: string | null) {
  if (!companyId) return null;

  const config = await CommunicationConfig.findOne({
    company_id: companyId,
    type: "email",
    is_active: true,
  });

  if (
    !config?.config?.email ||
    !config?.config?.smtp_host ||
    !config?.config?.smtp_port ||
    !config?.config?.smtp_user ||
    !config?.config?.smtp_password
  ) {
    return null;
  }

  return config;
}

async function sendAccountEmail(companyId: string | null | undefined, to: string, subject: string, text: string) {
  const config = await getEmailConfig(companyId);
  if (!config) return false;

  const transporter = nodemailer.createTransport({
    host: config.config.smtp_host,
    port: config.config.smtp_port,
    secure: config.config.smtp_port === 465,
    auth: {
      user: config.config.smtp_user,
      pass: decrypt(config.config.smtp_password),
    },
  });

  await transporter.sendMail({
    from: config.config.email,
    to,
    subject,
    text,
  });

  return true;
}

async function sendLoginNotification(user: any, profile: any, req: express.Request) {
  if (!user.loginNotificationsEnabled) return;

  try {
    await sendAccountEmail(
      profile?.company_id || null,
      user.email,
      "New login to your BridzoLead account",
      [
        `A new login was detected for ${user.email}.`,
        `Time: ${new Date().toLocaleString()}`,
        `IP: ${getClientIp(req)}`,
        "",
        "If this was you, no action is needed.",
      ].join("\n")
    );
  } catch (error) {
    console.error("[auth-service] Failed to send login notification:", error);
  }
}

async function finalizeLogin(res: express.Response, req: express.Request, user: any, profile: any, trustedDeviceToken?: string) {
  user.lastLoginAt = new Date();
  user.lastLoginIp = getClientIp(req);
  user.twoFactorCodeHash = null;
  user.twoFactorCodeExpiresAt = null;
  await user.save();

  await sendLoginNotification(user, profile, req);

  const token = buildAccessToken({ _id: user._id.toString(), email: user.email });
  return res.json({
    session: { access_token: token, refresh_token: "" },
    user: { id: user._id, email: user.email },
    profile,
    trusted_device_token: trustedDeviceToken,
  });
}

function hasCompanyPolicy(role: string, company: any) {
  return Boolean(company?.enforce_team_two_factor && !["broker", "owner", "super_admin"].includes(role));
}

function consumeRecoveryCode(user: any, code: string) {
  const hash = hashValue(code.toUpperCase());
  const index = (user.recoveryCodeHashes || []).findIndex((stored: string) => stored === hash);
  if (index === -1) return false;

  user.recoveryCodeHashes.splice(index, 1);
  return true;
}

function trustCurrentDevice(user: any, req: express.Request) {
  const trustedDeviceToken = generateRandomToken(24);
  const tokenHash = hashValue(trustedDeviceToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);

  user.trustedDevices = (user.trustedDevices || []).filter((device: any) => device.expiresAt > now);
  user.trustedDevices.push({
    tokenHash,
    expiresAt,
    createdAt: now,
    lastUsedAt: now,
    label: req.headers["user-agent"]?.toString().slice(0, 120) || "Trusted device",
  });

  return trustedDeviceToken;
}

function hasTrustedDevice(user: any, req: express.Request) {
  const token = req.headers["x-trusted-device-token"]?.toString();
  if (!token) return false;

  const tokenHash = hashValue(token);
  const now = new Date();
  const device = (user.trustedDevices || []).find((entry: any) => entry.tokenHash === tokenHash && entry.expiresAt > now);
  if (!device) return false;

  device.lastUsedAt = now;
  return true;
}

async function issueEmailTwoFactor(user: any, profile: any) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");

  user.twoFactorCodeHash = codeHash;
  user.twoFactorCodeExpiresAt = new Date(Date.now() + 1000 * 60 * 10);
  await user.save();

  const sent = await sendAccountEmail(
    profile?.company_id || null,
    user.email,
    "Your BridzoLead verification code",
    [`Your verification code is: ${code}`, "", "This code expires in 10 minutes."].join("\n")
  );

  if (!sent) {
    throw new Error("Email 2FA is enabled, but no email channel is configured.");
  }
}

app.get("/health", (_req: any, res: any) => res.json({ status: "ok", service: "auth-service" }));

app.use((req: any, _res: any, next: any) => {
  console.log(`[auth-service] ${req.method} ${req.url}`);
  next();
});

app.post("/auth/onboard", async (req: any, res: any) => {
  console.log("[auth-service] Onboard request received");
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.sub;

    const parsed = onboardSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { name, rera_license, city, address, phone, email, website } = parsed.data;

    // 1. Get default plan
    let defaultPlan = await Plan.findOne({ name: "pro" });
    if (!defaultPlan) {
      // Create a default plan if not exists for testing
      defaultPlan = await Plan.create({
        name: "pro",
        display_name: "Pro Plan",
        price_monthly: 2999,
        max_agents: 10,
        max_leads: 5000,
      });
    }

    // 2. Create the company
    const company = await Company.create({
      name,
      rera_license,
      city,
      address,
      phone,
      email,
      website,
      owner_id: userId,
      onboarding_status: "pending_approval",
      plan: defaultPlan.name,
      plan_id: defaultPlan._id.toString(),
    });

    // 3. Update profile
    const profile = await Profile.findOneAndUpdate(
      { user_id: userId },
      {
        company_id: company._id.toString(),
        role: "broker",
      },
      { new: true }
    );

    return res.status(201).json({ company, profile });
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
});

app.post("/auth/login", async (req: any, res: any) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const user = await User.findOne({ email });

  if (!user || !user.password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const profile = await Profile.findOne({ user_id: user._id.toString() });
  const company = profile?.company_id ? await Company.findById(profile.company_id) : null;
  const emailConfig = await getEmailConfig(profile?.company_id || null);
  const effectivePolicyEnabled = hasCompanyPolicy(profile?.role || "agent", company);
  const trustedDeviceValid = (user.twoFactorEnabled || effectivePolicyEnabled) && hasTrustedDevice(user, req);

  if (trustedDeviceValid) {
    return finalizeLogin(res, req, user, profile);
  }

  const effectiveMethod =
    user.twoFactorMethod ||
    (effectivePolicyEnabled && emailConfig ? "email" : null) ||
    (effectivePolicyEnabled && user.twoFactorSecret ? "authenticator" : null);

  if (effectiveMethod === "email") {
    await issueEmailTwoFactor(user, profile);
    return res.json({
      requiresTwoFactor: true,
      method: "email",
      temp_token: buildTempLoginToken(user._id.toString()),
      user: { id: user._id, email: user.email },
    });
  }

  if (effectiveMethod === "authenticator") {
    return res.json({
      requiresTwoFactor: true,
      method: "authenticator",
      temp_token: buildTempLoginToken(user._id.toString()),
      user: { id: user._id, email: user.email },
    });
  }

  if (effectivePolicyEnabled) {
    const secret = user.twoFactorTempSecret ? decrypt(user.twoFactorTempSecret) : generateTotpSecret();
    if (!user.twoFactorTempSecret) {
      user.twoFactorTempSecret = encrypt(secret);
      await user.save();
    }

    return res.json({
      requiresTwoFactor: true,
      requiresEnrollment: true,
      method: "authenticator",
      temp_token: buildTempLoginToken(user._id.toString()),
      user: { id: user._id, email: user.email },
      setup: {
        secret,
        otpauth_url: getOtpAuthUrl({
          accountName: user.email,
          secret,
          issuer: "BridzoLead",
        }),
      },
    });
  }

  return finalizeLogin(res, req, user, profile);
});

app.post("/auth/signup", async (req: any, res: any) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password, fullName, role } = parsed.data;

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ error: "User already exists" });

  const user = await User.create({
    email,
    password,
    rawUserMetaData: { full_name: fullName, role: role || "agent" }
  });

  // If the role is 'owner', create a default company and link it
  if (role === "owner") {
    let defaultPlan = await Plan.findOne({ name: "pro" });
    if (!defaultPlan) {
      defaultPlan = await Plan.create({
        name: "pro",
        display_name: "Pro Plan",
        price_monthly: 2999,
        max_agents: 10,
        max_leads: 5000,
      });
    }

    const company = await Company.create({
      name: `${fullName.trim()}'s Company`, // Default company name
      owner_id: user._id.toString(),
      plan: defaultPlan.name,
      plan_id: defaultPlan._id.toString(),
      is_active: true,
      onboarding_status: "onboarding",
    });

    await Profile.create({
      user_id: user._id.toString(),
      full_name: fullName.trim(),
      email: user.email,
      role: "owner",
      company_id: company._id.toString(),
    });
  } else {
    // For other roles, just create a profile without a company link initially
    await Profile.create({
      user_id: user._id.toString(),
      full_name: fullName,
      email: user.email,
      role: role || "agent",
    });
  }

  const token = buildAccessToken({ _id: user._id.toString(), email: user.email });

  return res.status(201).json({ user: { id: user._id, email: user.email }, session: { access_token: token } });
});

app.post("/auth/forgot-password", async (req: any, res: any) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email } = parsed.data;
  const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      success: true,
      message: "If this email exists, a reset token has been generated.",
    });
  }

  const resetToken = crypto.randomBytes(24).toString("hex");
  const resetPasswordTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const resetPasswordExpiresAt = new Date(Date.now() + 1000 * 60 * 15);

  user.resetPasswordTokenHash = resetPasswordTokenHash;
  user.resetPasswordExpiresAt = resetPasswordExpiresAt;
  await user.save();

  const response: Record<string, any> = {
    success: true, 
    message: "Reset token generated. Email delivery is not configured yet.",
  }; 

  if (process.env.NODE_ENV !== "production") {
    response.resetToken = resetToken;
    response.expiresAt = resetPasswordExpiresAt.toISOString();
  }

  return res.json(response);
});

app.post("/auth/reset-password", async (req: any, res: any) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ error: "Invalid or expired reset token" });
  }

  user.password = parsed.data.password;
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpiresAt = null;
  await user.save();

  return res.json({ success: true, message: "Password has been reset successfully." });
});

app.post("/auth/verify-2fa", async (req: any, res: any) => {
  const parsed = verifyTwoFactorSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const decoded: any = jwt.verify(parsed.data.temp_token, TEMP_LOGIN_SECRET);
    if (decoded?.purpose !== "2fa") return res.status(401).json({ error: "Invalid verification session" });

    const user = await User.findById(decoded.sub);
    if (!user) return res.status(404).json({ error: "User not found" });

    const profile = await Profile.findOne({ user_id: user._id.toString() });
    const company = profile?.company_id ? await Company.findById(profile.company_id) : null;
    const emailConfig = await getEmailConfig(profile?.company_id || null);
    const effectivePolicyEnabled = hasCompanyPolicy(profile?.role || "agent", company);
    const code = parsed.data.code.trim();
    const effectiveMethod =
      user.twoFactorMethod ||
      (effectivePolicyEnabled && emailConfig ? "email" : null) ||
      ((effectivePolicyEnabled && (user.twoFactorSecret || user.twoFactorTempSecret)) ? "authenticator" : null);

    if (!effectiveMethod) {
      return res.status(400).json({ error: "Two-factor authentication is not enabled" });
    }

    if (/^[A-Z0-9-]{8,}$/.test(code.toUpperCase()) && consumeRecoveryCode(user, code)) {
      const trustedDeviceToken = parsed.data.remember_device ? trustCurrentDevice(user, req) : undefined;
      await user.save();
      return finalizeLogin(res, req, user, profile, trustedDeviceToken);
    }

    if (effectiveMethod === "email") {
      const codeHash = crypto.createHash("sha256").update(code).digest("hex");
      const valid =
        Boolean(user.twoFactorCodeHash) &&
        user.twoFactorCodeHash === codeHash &&
        user.twoFactorCodeExpiresAt &&
        user.twoFactorCodeExpiresAt > new Date();

      if (!valid) {
        return res.status(400).json({ error: "Invalid or expired verification code" });
      }
    } else {
      const encryptedSecret = user.twoFactorSecret || user.twoFactorTempSecret;
      if (!encryptedSecret || !verifyTotpToken(decrypt(encryptedSecret), code)) {
        return res.status(400).json({ error: "Invalid authenticator code" });
      }

      if (!user.twoFactorEnabled && user.twoFactorTempSecret) {
        user.twoFactorEnabled = true;
        user.twoFactorMethod = "authenticator";
        user.twoFactorSecret = user.twoFactorTempSecret;
        user.twoFactorTempSecret = null;
      }
    }

    const trustedDeviceToken = parsed.data.remember_device ? trustCurrentDevice(user, req) : undefined;
    await user.save();
    return finalizeLogin(res, req, user, profile, trustedDeviceToken);
  } catch (error: any) {
    return res.status(401).json({ error: error.message || "Verification failed" });
  }
});

app.get("/auth/session", async (req: any, res: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.sub);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const profile = await Profile.findOne({ user_id: user._id.toString() });

    return res.json({ user: { id: user._id, email: user.email }, profile, session: { access_token: token } });
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
});

app.post("/auth/logout", (_req: any, res: any) => {
  res.json({ success: true });
});

const port = Number(process.env.AUTH_PORT || 8081);
app.listen(port, () => console.log(`[auth-service] listening on ${port}`));
