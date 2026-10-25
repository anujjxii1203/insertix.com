import { Router, Request, Response } from "express";
import { getTeamMembers, getTeamMemberById, createTeamMember, updateTeamMember, deleteTeamMember } from "../config/db";
import { requireAuth } from "../middleware/auth";
import { notifyUpdate } from "../config/events";
import { triggerFrontendRevalidation } from "../config/revalidate";
import { z } from "zod";

const router = Router();

const TeamMemberSchema = z.object({
  name: z.string().min(2),
  role: z.string().min(2),
  bio: z.string().min(5),
  avatar: z.string().min(1),
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
    triggerFrontendRevalidation(["team"]);

    return res.status(201).json(newMember);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create team member" });
  }
});

// PATCH /api/team/:id
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const updated = await updateTeamMember(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Team member not found" });

    notifyUpdate("team");
    triggerFrontendRevalidation(["team"]);

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update team member" });
  }
});

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
