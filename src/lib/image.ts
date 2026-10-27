/**
 * Image helper utility for responsive, fast-loading images with ImageKit CDN transformations.
 */

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "auto" | "webp" | "avif" | "jpeg" | "png";
  crop?: "maintain_ratio" | "force" | "at_max" | "at_least";
  focus?: "auto" | "face" | "center" | "top";
}

/**
 * Transforms an image URL to deliver optimized dimensions, formats, and quality.
 * Supports ImageKit CDN (?tr=...), Unsplash (?w=...), and local relative URLs.
 */
export function getOptimizedImageUrl(
  src?: string,
  options: ImageTransformOptions = {}
): string {
  if (!src || typeof src !== "string") return "";

  const cleanSrc = src.trim();
  const width = options.width || 640;
  const quality = options.quality || 75;
  const format = options.format || "auto";

  // 1. ImageKit URLs (e.g. https://ik.imagekit.io/...)
  if (cleanSrc.includes("ik.imagekit.io")) {
    const trParts: string[] = [`w-${width}`, `q-${quality}`, `f-${format}`];
    if (options.height) trParts.push(`h-${options.height}`);
    if (options.focus) trParts.push(`fo-${options.focus}`);
    if (options.crop) trParts.push(`cm-${options.crop}`);

    const trString = `tr=${trParts.join(",")}`;

    // If already has query string
    if (cleanSrc.includes("?")) {
      // If already has tr=, don't double append
      if (cleanSrc.includes("tr=")) {
        return cleanSrc;
      }
      return `${cleanSrc}&${trString}`;
    }
    return `${cleanSrc}?${trString}`;
  }

  // 2. Unsplash URLs
  if (cleanSrc.includes("images.unsplash.com")) {
    if (cleanSrc.includes("?")) {
      return `${cleanSrc}&w=${width}&q=${quality}&auto=format`;
    }
    return `${cleanSrc}?w=${width}&q=${quality}&auto=format`;
  }

  // 3. Local relative or external
  return cleanSrc;
}

/**
 * Normalizes image paths so relative /uploads/ paths are routed properly.
 * Ensures local uploads resolve to the local server or valid URL.
 */
export function normalizeImageUrl(path?: string): string {
  if (!path) return "";
  const clean = path.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }
  // Relative local upload path (e.g. /uploads/...)
  // In Next.js, files under public/uploads/ are served directly at /uploads/...
  return clean.startsWith("/") ? clean : `/${clean}`;
}
