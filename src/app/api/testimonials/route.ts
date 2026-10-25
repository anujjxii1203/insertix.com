import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getTestimonials, createTestimonial } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { notifyUpdate } from "@/lib/events";
import { z } from "zod";

export const dynamic = "force-dynamic";

const TestimonialSchema = z.object({
  clientName: z.string().min(2),
  company: z.string().min(2),
  role: z.string().min(2),
  content: z.string().min(10),
  avatar: z.string().min(1),
  rating: z.number().min(1).max(5).optional().default(5),
  order: z.number().optional().default(0),
  visible: z.boolean().optional().default(true),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("admin") === "true";
    const testimonials = await getTestimonials(!isAdmin);
    return NextResponse.json(testimonials, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = TestimonialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid testimonial data", details: parsed.error.issues }, { status: 400 });
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
  } catch (error) {
    console.error("Error creating testimonial:", error);
    return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
  }
}
