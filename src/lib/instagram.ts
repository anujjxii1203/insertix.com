export function normalizeInstagramUrl(val?: string): string {
  if (!val || typeof val !== "string") return "";
  let clean = val.trim();
  if (!clean || clean === "#") return "";

  // If user entered 'instagram.com/user' with or without protocol
  if (/^(?:https?:\/\/)?(?:www\.)?instagram\.com/i.test(clean)) {
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = `https://${clean}`;
    }
    try {
      const u = new URL(clean);
      const path = u.pathname.replace(/^\/+|\/+$/g, "");
      // If no username path or path is just reserved routes like 'p', ignore
      if (!path || path.toLowerCase() === "p") {
        return "";
      }
      return `https://www.instagram.com/${path}`;
    } catch {
      return "";
    }
  }

  // Handle '@handle' or plain 'handle'
  const handle = clean.replace(/^@/, "").replace(/\/+$/, "").replace(/[^a-zA-Z0-9._]/g, "");
  return handle ? `https://www.instagram.com/${handle}` : "";
}
