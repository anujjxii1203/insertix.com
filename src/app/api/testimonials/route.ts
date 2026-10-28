import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getTestimonials, createTestimonial, updateTestimonial } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { notifyUpdate } from "@/lib/events";
import { z } from "zod";

export const dynamic = "force-dynamic";

const TestimonialSchema = z.object({
  company: z.string().min(1, "Company name is required").transform((s) => s.trim()),
  content: z.string().min(5).max(280, "Quote cannot exceed 280 characters").transform((s) => s.trim()),
  clientName: z.string().max(60, "Client name cannot exceed 60 characters").nullish().default("").transform((s) => (s ? s.trim() : "")),
  role: z.string().nullish().default("").transform((s) => (s ? s.trim() : "")),
  avatar: z.string().optional().default(""),
  rating: z.number().min(1).max(5).optional().default(5),
  order: z.number().optional().default(0),
  visible: z.boolean().optional().default(true),
  focalX: z.number().min(0).max(100).optional().default(50),
  focalY: z.number().min(0).max(100).optional().default(50),
  zoom: z.number().min(1).max(5).optional().default(1),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("admin") === "true";
    const testimonials = await getTestimonials(!isAdmin);
    return NextResponse.json(testimonials, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = TestimonialSchema.safeParse(body);
    if (!parsed.success) {
      const issueMsgs = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      console.warn("Testimonial validation failed:", issueMsgs);
      return NextResponse.json({ error: `Validation error: ${issueMsgs}`, details: parsed.error.issues }, { status: 400 });
    }

    const newTestimonial = await createTestimonial({
      ...parsed.data,
      id: `test-${Date.now()}`,
    });

    try {
      revalidatePath("/");
    } catch {
      // ignore
    }
    notifyUpdate("testimonials");

    return NextResponse.json(newTestimonial, { status: 201 });
  } catch (error: any) {
    console.error("Error creating testimonial:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to create testimonial" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 });
    }

    const body = await req.json();
    const id = body.id || body._id;
    if (!id) {
      return NextResponse.json({ error: "Testimonial ID is required" }, { status: 400 });
    }

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
  } catch (error: any) {
    console.error("Error updating testimonial:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to update testimonial" }, { status: 500 });
  }
}
