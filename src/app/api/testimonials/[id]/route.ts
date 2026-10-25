import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { updateTestimonial, deleteTestimonial } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { notifyUpdate } from "@/lib/events";

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
    const updated = await updateTestimonial(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    try {
      revalidatePath("/");
    } catch {
      // ignore
    }
    notifyUpdate("testimonials");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating testimonial:", error);
    return NextResponse.json({ error: "Failed to update testimonial" }, { status: 500 });
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
    const success = await deleteTestimonial(id);
    if (!success) {
      return NextResponse.json({ error: "Testimonial not found or already deleted" }, { status: 404 });
    }

    try {
      revalidatePath("/");
    } catch {
      // ignore
    }
    notifyUpdate("testimonials");

    return NextResponse.json({ success: true, message: "Testimonial deleted successfully" });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    return NextResponse.json({ error: "Failed to delete testimonial" }, { status: 500 });
  }
}
