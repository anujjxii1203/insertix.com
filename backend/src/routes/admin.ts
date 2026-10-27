import { Router, Request, Response } from "express";
import {
  getContactMessages,
  updateContactMessage,
  deleteContactMessage,
  getActivityLogs,
  addActivityLog,
  getAdminByEmail,
  updateAdminPassword,
} from "../config/db";
import { requireAuth, comparePassword, hashPassword } from "../middleware/auth";
import { z } from "zod";

const router = Router();

// GET /api/admin/contacts
router.get("/contacts", requireAuth, async (req: Request, res: Response) => {
  try {
    const messages = await getContactMessages();
    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch inquiries" });
  }
});

// PATCH /api/admin/contacts/:id
router.patch("/contacts/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const updated = await updateContactMessage(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Inquiry not found" });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update inquiry" });
  }
});

// DELETE /api/admin/contacts/:id
router.delete("/contacts/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const success = await deleteContactMessage(req.params.id);
    if (!success) return res.status(404).json({ error: "Inquiry not found" });
    return res.json({ success: true, message: "Inquiry deleted" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete inquiry" });
  }
});

// GET /api/admin/activity-logs (last 100)
router.get("/activity-logs", requireAuth, async (_req: Request, res: Response) => {
  try {
    const logs = await getActivityLogs(100);
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});

// POST /api/admin/change-password
const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12, "New password must be at least 12 characters"),
});

router.post("/change-password", requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = ChangePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
    }

    const userEmail = (req as any).user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const admin = await getAdminByEmail(userEmail);
    if (!admin) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    const isMatch = await comparePassword(parsed.data.currentPassword, admin.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password does not match" });
    }

    const newHash = await hashPassword(parsed.data.newPassword);
    await updateAdminPassword(userEmail, newHash);

    await addActivityLog({
      adminEmail: userEmail,
      action: "Changed Admin Password",
      details: "Password was updated successfully",
    });

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ error: "Failed to change password" });
  }
});

// POST /api/admin/logout-all (Log out of all sessions)
router.post("/logout-all", requireAuth, async (req: Request, res: Response) => {
  const userEmail = (req as any).user?.email || "admin";
  const isProd = process.env.NODE_ENV === "production";

  await addActivityLog({
    adminEmail: userEmail,
    action: "Logged Out of All Sessions",
    details: "All active cookies cleared",
  });

  res.clearCookie("insertix_admin_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });

  return res.json({ success: true, message: "Logged out from all sessions" });
});

export default router;

