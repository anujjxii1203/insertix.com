import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getTeam, createTeamMember } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { notifyUpdate } from "@/lib/events";
import { normalizeInstagramUrl } from "@/lib/instagram";
import { z } from "zod";

export const dynamic = "force-dynamic";

const TeamMemberSchema = z.object({
  name: z.string().min(2).transform((s) => s.trim()),
  role: z.string().min(2).transform((s) => s.trim()),
  bio: z.string().min(5).transform((s) => s.trim()),
  avatar: z.string().min(1),
  instagram: z.string().optional().transform(normalizeInstagramUrl),
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("admin") === "true";
    const team = await getTeam(!isAdmin);
    return NextResponse.json(team, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = TeamMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid team member data", details: parsed.error.issues }, { status: 400 });
    }

    const newMember = await createTeamMember({
      ...parsed.data,
      id: `team-${Date.now()}`,
    });

    try {
      revalidatePath("/");
    } catch {
      // ignore
    }
    notifyUpdate("team");

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error("Error creating team member:", error);
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
  }
}
