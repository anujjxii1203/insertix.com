import { Router, Request, Response } from "express";
import { getSiteSettings, updateSiteSettings, addActivityLog } from "../config/db";
import { requireAuth } from "../middleware/auth";
import { notifyUpdate } from "../config/events";
import { triggerFrontendRevalidation } from "../config/revalidate";
import { z } from "zod";

const router = Router();

// Zod schema for settings update
const SiteSettingsUpdateSchema = z.object({
  hero: z.object({
    badge: z.string().min(1),
    headlineLine1: z.string().min(1),
    headlineLine2: z.string().min(1),
    accentWord: z.string().min(1),
    subtitle: z.string().min(1),
    primaryBtnText: z.string().min(1),
    secondaryBtnText: z.string().min(1),
  }).optional(),
  heroStats: z.array(z.object({
    value: z.string().min(1),
    suffix: z.string().optional().default(""),
    label: z.string().min(1),
    visible: z.boolean().optional().default(true),
    order: z.number().optional().default(0),
  })).optional(),
  about: z.object({
    heading: z.string().min(1),
    accentWord: z.string().min(1),
    paragraphs: z.array(z.string().min(1)),
    counters: z.array(z.object({
      label: z.string().min(1),
      number: z.number(),
      suffix: z.string().optional().default(""),
    })),
  }).optional(),
  trustedBrands: z.object({
    heading: z.string().min(1),
    visible: z.boolean().default(true),
    brands: z.array(z.object({
      name: z.string().min(1),
      logo: z.string().optional(),
      order: z.number().optional().default(0),
      visible: z.boolean().optional().default(true),
    })),
  }).optional(),
  services: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    tag: z.string().min(1),
    description: z.string().min(1),
    features: z.array(z.string()),
    icon: z.string().default("Video"),
    visible: z.boolean().optional().default(true),
    order: z.number().optional().default(0),
  })).optional(),
  contact: z.object({
    email: z.string().email(),
    phone1: z.string().min(5),
    phone2: z.string().min(5),
    city: z.string().min(1),
    workingHours: z.string().min(1),
    copyrightCompany: z.string().min(1),
    footerTagline: z.string().min(1),
    instagram: z.string().min(1),
    linkedin: z.string().min(1),
    whatsappNumber: z.string().min(5),
  }).optional(),
  seo: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    ogImage: z.string().min(1),
  }).optional(),
  sectionHeadings: z.object({
    work: z.object({ title: z.string(), accentWord: z.string(), subtext: z.string() }),
    about: z.object({ title: z.string(), accentWord: z.string(), subtext: z.string() }),
    members: z.object({ title: z.string(), accentWord: z.string(), subtext: z.string() }),
    recentWork: z.object({ title: z.string(), accentWord: z.string(), subtext: z.string() }),
    partners: z.object({ title: z.string(), accentWord: z.string(), subtext: z.string() }),
    contact: z.object({ title: z.string(), accentWord: z.string(), subtext: z.string() }),
  }).optional(),
  themeDefault: z.enum(["system", "light", "dark"]).optional(),
  useScriptFontForAccents: z.boolean().optional(),
});

// GET /api/settings - Public endpoint
router.get("/", async (_req: Request, res: Response) => {
  try {
    const settings = await getSiteSettings();
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res.json(settings);
  } catch (error) {
    console.error("Failed to fetch site settings:", error);
    return res.status(500).json({ error: "Failed to fetch site settings" });
  }
});

// PUT & PATCH /api/settings - Admin protected
const handleUpdateSettings = async (req: Request, res: Response) => {
  try {
    const parsed = SiteSettingsUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid settings format", details: parsed.error.issues });
    }

    const updated = await updateSiteSettings(parsed.data);

    // Record activity log
    const userEmail = (req as any).user?.email || "admin";
    await addActivityLog({
      adminEmail: userEmail,
      action: "Updated Site Settings",
      details: `Sections modified: ${Object.keys(parsed.data).join(", ")}`,
    });

    notifyUpdate("settings");
    const reval = await triggerFrontendRevalidation(["settings"]);

    return res.json({
      ...updated,
      _revalidation: reval,
    });
  } catch (error) {
    console.error("Failed to update site settings:", error);
    return res.status(500).json({ error: "Failed to update site settings" });
  }
};

router.put("/", requireAuth, handleUpdateSettings);
router.patch("/", requireAuth, handleUpdateSettings);

export default router;
