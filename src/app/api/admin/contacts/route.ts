import { NextResponse } from "next/server";
import { getContactMessages } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await getContactMessages();
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching admin messages:", error);
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 });
  }
}
