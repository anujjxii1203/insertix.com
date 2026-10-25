export async function triggerFrontendRevalidation(tags: string[] = ["projects"]) {
  const frontendUrl = process.env.FRONTEND_URL;
  const secret = process.env.REVALIDATE_SECRET;

  if (!frontendUrl || !secret) {
    return;
  }

  try {
    const url = `${frontendUrl.replace(/\/$/, "")}/api/revalidate`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({ tags }),
    });
    console.log(`Triggered ISR revalidation on ${url} for tags: ${tags.join(", ")}`);
  } catch (err) {
    console.warn("Failed to trigger Vercel revalidation:", err);
  }
}
