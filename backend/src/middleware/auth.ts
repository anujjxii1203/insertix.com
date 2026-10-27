import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";

// JWT_SECRET must be set in .env — refuse to start if missing (dev and prod)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error(
    "FATAL: JWT_SECRET environment variable is missing or too short (< 32 chars).\n" +
    "Add JWT_SECRET to backend/.env and restart."
  );
  process.exit(1);
}

// Secret is derived once at startup — guaranteed to be the same for sign + verify
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

export interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Issues an 8-hour access token (no separate refresh token needed for this scale). */
export async function createAdminToken(payload: AdminSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET_KEY);
}

export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // 1. Try Authorization: Bearer <token> header (primary path for local dev proxy)
  let token: string | undefined;
  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  // 2. Fallback: httpOnly cookie (works in production where SameSite=None + Secure is set)
  if (!token) {
    token = req.cookies?.insertix_admin_token;
  }

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Missing authentication token" });
  }

  const session = await verifyAdminToken(token);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }

  (req as any).user = session;
  next();
}
