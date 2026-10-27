import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "insertix_super_secret_jwt_key_2026_ultra_secure";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

export interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAdminToken(payload: AdminSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
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

import { headers } from "next/headers";

export async function getAdminSession(req?: Request): Promise<AdminSession | null> {
  // 1. Check Authorization header from parameter request if passed
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      const token = authHeader.substring(7).trim();
      const session = await verifyAdminToken(token);
      if (session) return session;
    }
  }

  // 2. Check incoming headers() in Next.js Server Components / Route Handlers
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      const token = authHeader.substring(7).trim();
      const session = await verifyAdminToken(token);
      if (session) return session;
    }
  } catch {
    // headers() might not be available in non-RSC contexts
  }

  // 3. Fallback to httpOnly cookie
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("insertix_admin_token")?.value;
    if (token) {
      return verifyAdminToken(token);
    }
  } catch {
    // ignore
  }

  return null;
}
