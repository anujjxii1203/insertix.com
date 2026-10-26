/**
 * API client helper to route requests to standalone Express backend or local fallback
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Normalizes image paths so relative /uploads/ paths are routed to the Express backend or fallback
 */
export function normalizeImageUrl(path?: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("/uploads/")) {
    // If running with standalone backend URL, route to the backend domain
    if (process.env.NEXT_PUBLIC_API_URL) {
      const base = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
      return `${base}${path}`;
    }
  }
  return path;
}
