export function normalizeInstagramUrl(val?: string): string {
  if (!val || typeof val !== "string" || val.trim() === "") return "";
  const clean = val.trim();
  if (clean === "#") return "";
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    try {
      const u = new URL(clean);
      if (u.hostname.includes("instagram.com")) {
        const path = u.pathname.replace(/^\/+|\/+$/g, "");
        // If it's just "instagram.com" or "instagram.com/" with no username, ignore
        if (!path || path === "" || path.toLowerCase() === "p") {
          return "";
        }
        return clean;
      }
      return "";
    } catch {
      return "";
    }
  }
  const handle = clean.replace(/^@/, "").replace(/[^a-zA-Z0-9._]/g, "");
  return handle ? `https://www.instagram.com/${handle}` : "";
}
