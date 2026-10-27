import { NextRequest, NextResponse } from "next/server";
import { getSiteSettings, updateSiteSettings, addActivityLog } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { notifyUpdate } from "@/lib/events";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

export const dynamic = "force-dynamic";

const SiteSettingsUpdateSchema = z.object({
  hero: z.object({
    badge: z.string().min(1),
    headlineLine1: z.string().min(1),
    headlineLine2: z.string().min(1),
    accentWord: z.string().min(1),
    subtitle: z.string().min(1),
    primaryBtnText: z.string().min(1),
    secondaryBtnText: z.string().min(1),
  }).optional(),
  heroStats: z.array(z.object({
    value: z.string().min(1),
    suffix: z.string().optional().default(""),
    label: z.string().min(1),
    visible: z.boolean().optional().default(true),
    order: z.number().optional().default(0),
  })).optional(),
  about: z.object({
    heading: z.string().min(1),
    accentWord: z.string().min(1),
    paragraphs: z.array(z.string().min(1)),
    counters: z.array(z.object({
      label: z.string().min(1),
      number: z.number(),
      suffix: z.string().optional().default(""),
    })),
  }).optional(),
  trustedBrands: z.object({
    heading: z.string().min(1),
    visible: z.boolean().default(true),
    brands: z.array(z.object({
      name: z.string().min(1),
      logo: z.string().optional(),
      order: z.number().optional().default(0),
      visible: z.boolean().optional().default(true),
    })),
  }).optional(),
  services: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    tag: z.string().min(1),
    description: z.string().min(1),
    features: z.array(z.string()),
    icon: z.string().default("Video"),
    visible: z.boolean().optional().default(true),
    order: z.number().optional().default(0),
  })).optional(),
  contact: z.object({
    email: z.string().email(),
    phone1: z.string().min(5),
    phone2: z.string().min(5),
    city: z.string().min(1),
    workingHours: z.string().min(1),
    copyrightCompany: z.string().min(1),
    footerTagline: z.string().min(1),
    instagram: z.string().min(1),
    linkedin: z.string().min(1),
    whatsappNumber: z.string().min(5),
  }).optional(),
  seo: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    ogImage: z.string().min(1),
  }).optional(),
  sectionHeadings: z.object({
    work: z.object({ title: z.string(), accentWord: z.string(), subtext: z.string() }),
    about: z.object({ title: z.string(), accentWord: z.string(), subtext: z.string() }),
    members: z.object({ title: z.string(), accentWord: z.string(), subtext: z.string() }),
    recentWork: z.object({ title: z.string(), accentWord: z.string(), subtext: z.string() }),
    partners: z.object({ title: z.string(), accentWord: z.string(), subtext: z.string() }),
    contact: z.object({ title: z.string(), accentWord: z.string(), subtext: z.string() }),
  }).optional(),
  themeDefault: z.enum(["system", "light", "dark"]).optional(),
  useScriptFontForAccents: z.boolean().optional(),
});

// GET /api/settings
export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = SiteSettingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings data", details: parsed.error.issues }, { status: 400 });
    }

    const updated = await updateSiteSettings(parsed.data);

    await addActivityLog({
      adminEmail: session.email,
      action: "Updated Site Settings",
      details: `Sections modified: ${Object.keys(parsed.data).join(", ")}`,
    });

    notifyUpdate("settings");

    try {
      (revalidateTag as any)("settings");
      revalidatePath("/");
    } catch {
      // ignore
    }

    return NextResponse.json({
      ...updated,
      _revalidation: { success: true },
    });
  } catch (error: any) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}
