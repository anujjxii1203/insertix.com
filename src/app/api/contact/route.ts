import { NextResponse } from "next/server";
import { createContactMessage } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendContactEmailNotification } from "@/lib/email";
import { z } from "zod";

const ContactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(150),
  phone: z.string().trim().min(6, "Valid phone number is required").max(30),
  service: z.enum([
    "Video Shoots",
    "Photoshoots",
    "Marketing",
    "Product Shoot",
    "Event Shoots",
    "Other / Multiple Services",
  ]),
  budget: z.string().trim().min(1, "Budget selection is required").max(100),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(3000),
  // Honeypot field (hidden in UI) - must be empty
  website: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const { allowed } = checkRateLimit(ip.split(",")[0].trim(), 5, 10 * 60 * 1000);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many contact requests from this address. Please wait a few minutes or chat with us directly on WhatsApp." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    // Bot honeypot caught
    if (parsed.data.website && parsed.data.website.length > 0) {
      return NextResponse.json({ success: true, message: "Thank you for reaching out." }, { status: 200 });
    }

    const { website: _, ...data } = parsed.data;
    const newMessage = await createContactMessage({
      id: `msg-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      status: "new",
    });

    try {
      const { notifyUpdate } = await import("@/lib/events");
      notifyUpdate("leads");
    } catch {
      // ignore
    }

    // Send email notification to admin asynchronously (won't block user response)
    sendContactEmailNotification(data).catch((err) =>
      console.error("Async email dispatch notice:", err)
    );

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for reaching out to Insertix Media. Our creative directors will contact you within 24 hours.",
        id: newMessage.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json({ error: "Failed to process inquiry" }, { status: 500 });
  }
}
