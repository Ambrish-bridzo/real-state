import type { Request } from "express";
import jwt from "jsonwebtoken";
import { Profile } from "./models/company_profile";

const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret-for-dev";

export type RequestContext = {
  userId: string;
  companyId: string | null;
  role: string;
};

export async function getRequestContext(req: Request): Promise<RequestContext | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.sub) return null;

    const profile = await Profile.findOne({ user_id: decoded.sub });
    if (!profile) return null;

    return {
      userId: decoded.sub,
      companyId: profile.company_id || null,
      role: profile.role,
    };
  } catch (error) {
    console.error("[auth] Token verification failed:", error);
    return null;
  }
}
