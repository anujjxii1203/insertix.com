import { Router, Request, Response } from "express";
import { getContactMessages, updateContactMessage, deleteContactMessage } from "../config/db";
import { requireAuth } from "../middleware/auth";

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

export default router;
