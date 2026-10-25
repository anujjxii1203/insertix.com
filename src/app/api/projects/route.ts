import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getProjects, createProject } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { notifyUpdate } from "@/lib/events";
import { z } from "zod";

export const dynamic = "force-dynamic";

const linkRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/i;

const ProjectCreateSchema = z.object({
  title: z.string().min(2),
  category: z.enum([
    "video",
    "photo",
    "product",
    "event",
    "marketing",
  ]),
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
});


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cat = searchParams.get("category");
    const isAdmin = searchParams.get("admin") === "true";

    let projects = await getProjects(!isAdmin);
    if (cat && cat.toLowerCase() !== "all") {
      projects = projects.filter((p) => p.category.toLowerCase() === cat.toLowerCase());
    }
    return NextResponse.json(projects, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ProjectCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid project data", details: parsed.error.issues }, { status: 400 });
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

    try {
      revalidatePath("/");
    } catch {
      // ignore
    }
    notifyUpdate("projects");

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

