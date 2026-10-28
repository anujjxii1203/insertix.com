import { NextResponse } from "next/server";
import { connectDB, getDbConnectionStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
  } catch {
    // Ignore error, getDbConnectionStatus handles state
  }

  const status = getDbConnectionStatus();
  return NextResponse.json(status);
}

