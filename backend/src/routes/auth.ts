import { Router, Request, Response } from "express";
import { getAdminByEmail } from "../config/db";
import { comparePassword, createAdminToken, requireAuth } from "../middleware/auth";
import { loginLimiter } from "../middleware/rateLimit";
import { z } from "zod";

const router = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Admin Login
router.post("/login", loginLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid credentials format" });
    }

    const { email, password } = parsed.data;
    const admin = await getAdminByEmail(email);
    if (!admin) {
      // Artificial delay to prevent timing attacks
      await new Promise((r) => setTimeout(r, 200));
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await comparePassword(password, admin.passwordHash);
    if (!isMatch) {
      await new Promise((r) => setTimeout(r, 200));
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = await createAdminToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("insertix_admin_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax", // SameSite=None+Secure only in production (https)
      maxAge: 8 * 60 * 60 * 1000, // 8 hours — matches JWT expiry
      path: "/",
    });

    return res.json({
      success: true,
      user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      token,
    });
  } catch (error) {
    console.error("Auth login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Admin Me
router.get("/me", requireAuth, (req: Request, res: Response) => {
  return res.json({
    authenticated: true,
    user: (req as any).user,
  });
});

// Admin Logout
router.post("/logout", (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("insertix_admin_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
  return res.json({ success: true, message: "Logged out successfully" });
});

export default router;
