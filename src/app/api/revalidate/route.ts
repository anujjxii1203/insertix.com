import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-revalidate-secret");
    const expectedSecret = process.env.REVALIDATE_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ error: "Invalid revalidation secret" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const tags = Array.isArray(body.tags) ? body.tags : [];

    // Revalidate requested cache tags
    for (const tag of tags) {
      try {
        (revalidateTag as any)(tag);
      } catch {
        // ignore
      }
    }

    // Revalidate home page path
    revalidatePath("/");

    return NextResponse.json({
      revalidated: true,
      tags,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Revalidation failed" }, { status: 500 });
  }
}
