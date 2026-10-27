import { Router, Request, Response } from "express";
import { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from "../config/db";
import { requireAuth } from "../middleware/auth";
import { notifyUpdate } from "../config/events";
import { triggerFrontendRevalidation } from "../config/revalidate";
import { z } from "zod";

const router = Router();

const TestimonialSchema = z.object({
  clientName: z.string().min(2).transform(s => s.trim()),
  company: z.string().min(1).transform(s => s.trim()),
  role: z.string().min(1).transform(s => s.trim()),
  content: z.string().min(5).max(280, "Quote cannot exceed 280 characters").transform(s => s.trim()),
  avatar: z.string().min(1),
  rating: z.number().min(1).max(5).default(5),
  order: z.number().optional().default(0),
  visible: z.boolean().optional().default(true),
  focalX: z.number().min(0).max(100).optional().default(50),
  focalY: z.number().min(0).max(100).optional().default(50),
  zoom: z.number().min(1).max(5).optional().default(1),
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
    const reval = await triggerFrontendRevalidation(["testimonials"]);

    return res.status(201).json({
      ...newTestimonial,
      _revalidation: reval,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create testimonial" });
  }
});

// PUT & PATCH /api/testimonials/:id
const handleUpdateTestimonial = async (req: Request, res: Response) => {
  try {
    const updated = await updateTestimonial(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Testimonial not found" });

    notifyUpdate("testimonials");
    const reval = await triggerFrontendRevalidation(["testimonials"]);

    return res.json({
      ...updated,
      _revalidation: reval,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update testimonial" });
  }
};
router.patch("/:id", requireAuth, handleUpdateTestimonial);
router.put("/:id", requireAuth, handleUpdateTestimonial);

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
