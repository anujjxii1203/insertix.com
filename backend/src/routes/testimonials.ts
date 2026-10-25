import { Router, Request, Response } from "express";
import { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from "../config/db";
import { requireAuth } from "../middleware/auth";
import { notifyUpdate } from "../config/events";
import { triggerFrontendRevalidation } from "../config/revalidate";
import { z } from "zod";

const router = Router();

const TestimonialSchema = z.object({
  clientName: z.string().min(2),
  company: z.string().min(1),
  role: z.string().min(1),
  content: z.string().min(5),
  avatar: z.string().min(1),
  rating: z.number().min(1).max(5).default(5),
  order: z.number().optional().default(0),
  visible: z.boolean().optional().default(true),
});

// GET /api/testimonials
router.get("/", async (req: Request, res: Response) => {
  try {
    const isAdmin = req.query.admin === "true";
    const testimonials = await getTestimonials(!isAdmin);
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res.json(testimonials);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch testimonials" });
  }
});

// POST /api/testimonials
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = TestimonialSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid testimonial data", details: parsed.error.issues });
    }

    const newTestimonial = await createTestimonial({
      ...parsed.data,
      id: `test-${Date.now()}`,
    });

    notifyUpdate("testimonials");
    triggerFrontendRevalidation(["testimonials"]);

    return res.status(201).json(newTestimonial);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create testimonial" });
  }
});

// PATCH /api/testimonials/:id
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const updated = await updateTestimonial(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Testimonial not found" });

    notifyUpdate("testimonials");
    triggerFrontendRevalidation(["testimonials"]);

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update testimonial" });
  }
});

// DELETE /api/testimonials/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const success = await deleteTestimonial(req.params.id);
    if (!success) return res.status(404).json({ error: "Testimonial not found" });

    notifyUpdate("testimonials");
    triggerFrontendRevalidation(["testimonials"]);

    return res.json({ success: true, message: "Testimonial deleted" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete testimonial" });
  }
});

export default router;
