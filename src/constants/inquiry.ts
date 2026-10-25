export const SERVICES_OPTIONS = [
  "Video Shoots",
  "Photoshoots",
  "Marketing",
  "Product Shoot",
  "Event Shoots",
  "Other / Multiple Services",
] as const;

export const BUDGET_OPTIONS = [
  "Under ₹50,000",
  "₹50,000 - ₹2,00,000",
  "₹2,00,000 - ₹5,00,000",
  "₹5,00,000+",
] as const;

export const PROJECT_CATEGORIES = [
  { value: "video", label: "Video" },
  { value: "photo", label: "Photo" },
  { value: "product", label: "Product" },
  { value: "event", label: "Event" },
  { value: "marketing", label: "Marketing" },
] as const;
