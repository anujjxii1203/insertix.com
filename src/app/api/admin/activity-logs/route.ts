import { NextResponse } from "next/server";
import { getActivityLogs } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logs = await getActivityLogs(100);
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
