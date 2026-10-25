import { NextResponse } from "next/server";
import { deleteContactMessage, updateContactMessage } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function PATCH(
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
    const updated = await updateContactMessage(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating contact inquiry:", error);
    return NextResponse.json({ error: "Failed to update inquiry" }, { status: 500 });
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
    const success = await deleteContactMessage(id);
    if (!success) {
      return NextResponse.json({ error: "Message not found or already deleted" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Inquiry deleted" });
  } catch (error) {
    console.error("Error deleting contact inquiry:", error);
    return NextResponse.json({ error: "Failed to delete inquiry" }, { status: 500 });
  }
}
