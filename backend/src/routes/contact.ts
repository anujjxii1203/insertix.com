import { Router, Request, Response } from "express";
import { createContactMessage } from "../config/db";
import { contactLimiter } from "../middleware/rateLimit";
import { sendContactEmailNotification } from "../config/email";
import { notifyUpdate } from "../config/events";
import { z } from "zod";

const router = Router();

const ContactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(6, "Valid phone number is required"),
  service: z.enum([
    "Video Shoots",
    "Photoshoots",
    "Marketing",
    "Product Shoot",
    "Event Shoots",
    "Other / Multiple Services",
  ]),
  budget: z.string().min(1, "Budget selection is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

// POST /api/contact
router.post("/", contactLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = ContactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.issues.map((i) => i.message),
      });
    }

    const data = parsed.data;
    const newMessage = await createContactMessage({
      id: `msg-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      status: "new",
    });

    notifyUpdate("leads");

    // Async email notification dispatch
    sendContactEmailNotification(data).catch((err) =>
      console.error("Async email dispatch notice:", err)
    );

    return res.status(201).json({
      success: true,
      message: "Thank you for reaching out to Insertix Media. Our creative team will contact you within 24 hours.",
      id: newMessage.id,
    });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return res.status(500).json({ error: "Failed to process inquiry" });
  }
});

export default router;
