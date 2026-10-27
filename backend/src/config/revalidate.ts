export async function triggerFrontendRevalidation(tags: string[] = ["projects"]): Promise<{ success: boolean; status?: number; error?: string }> {
  const frontendUrl = process.env.FRONTEND_URL;
  const secret = process.env.REVALIDATE_SECRET;

  if (!frontendUrl || !secret) {
    const missing = [!frontendUrl && "FRONTEND_URL", !secret && "REVALIDATE_SECRET"].filter(Boolean).join(", ");
    console.warn(`[Revalidation] Skipped: Missing env vars (${missing})`);
    return { success: false, error: `Missing env: ${missing}` };
  }

  try {
    const url = `${frontendUrl.replace(/\/$/, "")}/api/revalidate`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({ tags }),
    });

    if (res.ok) {
      console.log(`[Revalidation] Success: ${url} for tags: ${tags.join(", ")} (status ${res.status})`);
      return { success: true, status: res.status };
    } else {
      const text = await res.text().catch(() => "");
      console.error(`[Revalidation] Failed: ${url} returned ${res.status}: ${text}`);
      return { success: false, status: res.status, error: text || `HTTP ${res.status}` };
    }
  } catch (err: any) {
    console.error("[Revalidation] Network/DNS error triggering Vercel revalidation:", err);
    return { success: false, error: err.message || "Network error" };
  }
}
