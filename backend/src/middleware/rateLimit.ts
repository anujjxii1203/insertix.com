import rateLimit from "express-rate-limit";

// Global rate limit: 100 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests from this IP, please try again in 15 minutes.",
  },
});

// Admin login rate limit: 5 attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many login attempts. Account temporarily locked for 15 minutes.",
  },
});

// Upload route rate limit: 20 uploads per hour per IP
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Upload limit reached. Maximum 20 uploads allowed per hour.",
  },
});

// Contact inquiry rate limit: 5 inquiries per 15 minutes per IP
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many contact submissions. Please wait or reach out via WhatsApp.",
  },
});
