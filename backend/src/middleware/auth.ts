import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.includes("dummy")) {
  if (process.env.NODE_ENV === "production") {
    console.error("FATAL: JWT_SECRET environment variable must be at least 32 characters in production!");
    process.exit(1);
  }
}

const SECRET_KEY = new TextEncoder().encode(
  JWT_SECRET || "insertix_super_secret_jwt_key_2026_ultra_secure_min_32"
);

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

export async function createAdminToken(payload: AdminSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h") // 2 hours short-lived
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
  let token = req.cookies?.insertix_admin_token;
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
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
