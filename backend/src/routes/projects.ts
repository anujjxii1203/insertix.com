import { Router, Request, Response } from "express";
import { getProjects, getProjectById, createProject, updateProject, deleteProject } from "../config/db";
import { requireAuth } from "../middleware/auth";
import { notifyUpdate } from "../config/events";
import { triggerFrontendRevalidation } from "../config/revalidate";
import { z } from "zod";

const router = Router();

const linkRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/i;

const ProjectCreateSchema = z.object({
  title: z.string().min(2),
  category: z.enum(["video", "photo", "product", "event", "marketing"]),
  client: z.string().min(1),
  description: z.string().optional().default(""),
  coverImage: z.string().min(1),
  videoPreview: z.string().optional().default(""),
  link: z
    .string()
    .optional()
    .default("")
    .refine(
      (val) => !val || val.trim() === "" || linkRegex.test(val.trim()),
      { message: "Link must be a valid http:// or https:// URL" }
    ),
  featured: z.boolean().optional().default(false),
  deliverables: z.array(z.string()).optional().default([]),
  metrics: z.string().optional().default(""),
  year: z.string().min(4),
  order: z.number().optional().default(0),
  visible: z.boolean().optional().default(true),
  focalX: z.number().min(0).max(100).optional().default(50),
  focalY: z.number().min(0).max(100).optional().default(50),
  zoom: z.number().min(1).max(5).optional().default(1),
  aspectRatio: z.string().optional().default("4:3"),
});

// GET /api/projects
router.get("/", async (req: Request, res: Response) => {
  try {
    const cat = req.query.category as string | undefined;
    const isAdmin = req.query.admin === "true";

    let projects = await getProjects(!isAdmin);
    if (cat && cat.toLowerCase() !== "all") {
      projects = projects.filter((p) => p.category.toLowerCase() === cat.toLowerCase());
    }

    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// GET /api/projects/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const project = await getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    return res.json(project);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch project" });
  }
});

// POST /api/projects
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = ProjectCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid project data", details: parsed.error.issues });
    }

    let link = parsed.data.link?.trim() || "";
    if (link && !/^https?:\/\//i.test(link)) {
      link = `https://${link}`;
    }

    const newProject = await createProject({
      ...parsed.data,
      link,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });

    notifyUpdate("projects");
    const reval = await triggerFrontendRevalidation(["projects"]);

    return res.status(201).json({
      ...newProject,
      _revalidation: reval,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({ error: "Failed to create project" });
  }
});

// PUT & PATCH /api/projects/:id
const handleUpdateProject = async (req: Request, res: Response) => {
  try {
    const updated = await updateProject(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Project not found" });

    notifyUpdate("projects");
    const reval = await triggerFrontendRevalidation(["projects"]);

    return res.json({
      ...updated,
      _revalidation: reval,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update project" });
  }
};
router.patch("/:id", requireAuth, handleUpdateProject);
router.put("/:id", requireAuth, handleUpdateProject);

// DELETE /api/projects/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const success = await deleteProject(req.params.id);
    if (!success) return res.status(404).json({ error: "Project not found" });

    notifyUpdate("projects");
    triggerFrontendRevalidation(["projects"]);

    return res.json({ success: true, message: "Project deleted" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
