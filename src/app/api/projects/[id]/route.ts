import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getProjectById, updateProject, deleteProject } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { notifyUpdate } from "@/lib/events";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    if (body.link !== undefined) {
      let link = typeof body.link === "string" ? body.link.trim() : "";
      if (link && !/^https?:\/\//i.test(link)) {
        // If not starting with http/https, auto prepend https:// unless javascript: or similar
        if (/^[a-z0-9+.-]+:/i.test(link) && !/^https?:/i.test(link)) {
          return NextResponse.json({ error: "Only http:// or https:// links are allowed" }, { status: 400 });
        }
        link = `https://${link}`;
      }
      body.link = link;
    }

    const updated = await updateProject(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }


    try {
      revalidatePath("/");
    } catch {
      // ignore
    }
    notifyUpdate("projects");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const success = await deleteProject(id);
    if (!success) {
      return NextResponse.json({ error: "Project not found or already deleted" }, { status: 404 });
    }

    try {
      revalidatePath("/");
    } catch {
      // ignore
    }
    notifyUpdate("projects");

    return NextResponse.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
