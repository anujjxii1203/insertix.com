import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getTeam, createTeamMember } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { notifyUpdate } from "@/lib/events";
import { z } from "zod";

export const dynamic = "force-dynamic";

const TeamMemberSchema = z.object({
  name: z.string().min(2),
  role: z.string().min(2),
  bio: z.string().min(10),
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("admin") === "true";
    const team = await getTeam(!isAdmin);
    return NextResponse.json(team, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
