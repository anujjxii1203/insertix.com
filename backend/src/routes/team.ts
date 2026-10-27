import { Router, Request, Response } from "express";
import { getTeamMembers, getTeamMemberById, createTeamMember, updateTeamMember, deleteTeamMember } from "../config/db";
import { requireAuth } from "../middleware/auth";
import { notifyUpdate } from "../config/events";
import { triggerFrontendRevalidation } from "../config/revalidate";
import { z } from "zod";

const router = Router();

const normalizeInstagram = (val?: string) => {
  if (!val || typeof val !== "string" || val.trim() === "") return "";
  const clean = val.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    try {
      const u = new URL(clean);
      if (u.hostname.includes("instagram.com")) {
        return clean;
      }
      return "";
    } catch {
      return "";
    }
  }
  const handle = clean.replace(/^@/, "").replace(/[^a-zA-Z0-9._]/g, "");
  return handle ? `https://www.instagram.com/${handle}` : "";
};

const TeamMemberSchema = z.object({
  name: z.string().min(2).transform(s => s.trim()),
  role: z.string().min(2).transform(s => s.trim()),
  bio: z.string().min(5).transform(s => s.trim()),
  avatar: z.string().min(1),
  instagram: z.string().optional().transform(normalizeInstagram),
  socials: z
    .object({
      linkedin: z.string().optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      dribbble: z.string().optional(),
    })
    .optional()
    .default({}),
  order: z.number().optional().default(0),
  visible: z.boolean().optional().default(true),
  focalX: z.number().min(0).max(100).optional().default(50),
  focalY: z.number().min(0).max(100).optional().default(22),
  zoom: z.number().min(1).max(5).optional().default(1),
});

// GET /api/team
router.get("/", async (req: Request, res: Response) => {
  try {
    const isAdmin = req.query.admin === "true";
    const team = await getTeamMembers(!isAdmin);
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res.json(team);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch team members" });
  }
});

// POST /api/team
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = TeamMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid team member data", details: parsed.error.issues });
    }

    const newMember = await createTeamMember({
      ...parsed.data,
      id: `team-${Date.now()}`,
    });

    notifyUpdate("team");
    const reval = await triggerFrontendRevalidation(["team"]);

    return res.status(201).json({
      ...newMember,
      _revalidation: reval,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create team member" });
  }
});

// PUT & PATCH /api/team/:id
const handleUpdateTeam = async (req: Request, res: Response) => {
  try {
    const updated = await updateTeamMember(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Team member not found" });

    notifyUpdate("team");
    const reval = await triggerFrontendRevalidation(["team"]);

    return res.json({
      ...updated,
      _revalidation: reval,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update team member" });
  }
};
router.patch("/:id", requireAuth, handleUpdateTeam);
router.put("/:id", requireAuth, handleUpdateTeam);

// DELETE /api/team/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const success = await deleteTeamMember(req.params.id);
    if (!success) return res.status(404).json({ error: "Team member not found" });

    notifyUpdate("team");
    triggerFrontendRevalidation(["team"]);

    return res.json({ success: true, message: "Team member deleted" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete team member" });
  }
});

export default router;
