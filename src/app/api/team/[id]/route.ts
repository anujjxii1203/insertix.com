import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { updateTeamMember, deleteTeamMember } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { notifyUpdate } from "@/lib/events";
import { normalizeInstagramUrl } from "@/lib/instagram";

export const dynamic = "force-dynamic";

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

    const normalizedBody = { ...body };
    if ("instagram" in normalizedBody) {
      normalizedBody.instagram = normalizeInstagramUrl(normalizedBody.instagram);
      normalizedBody.socials = {
        ...(normalizedBody.socials || {}),
        instagram: normalizedBody.instagram,
      };
    }

    const updated = await updateTeamMember(id, normalizedBody);
    if (!updated) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    try {
      revalidatePath("/");
    } catch {
      // ignore
    }
    notifyUpdate("team");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json({ error: "Failed to update team member" }, { status: 500 });
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
    const success = await deleteTeamMember(id);
    if (!success) {
      return NextResponse.json({ error: "Team member not found or already deleted" }, { status: 404 });
    }

    try {
      revalidatePath("/");
    } catch {
      // ignore
    }
    notifyUpdate("team");

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting team member:", error);
    return NextResponse.json({ error: "Failed to delete team member" }, { status: 500 });
  }
}
