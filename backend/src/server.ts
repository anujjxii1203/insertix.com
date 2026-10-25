import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

import { connectDB } from "./config/db";
import { globalLimiter } from "./middleware/rateLimit";

import authRoutes from "./routes/auth";
import projectRoutes from "./routes/projects";
import teamRoutes from "./routes/team";
import testimonialRoutes from "./routes/testimonials";
import adminRoutes from "./routes/admin";
import contactRoutes from "./routes/contact";
import eventRoutes from "./routes/events";
import uploadRoutes from "./routes/upload";

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (Render, Cloudflare, etc.)
app.set("trust proxy", 1);

// Disable x-powered-by header
app.disable("x-powered-by");

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed by frontend Vercel/Next.js
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Gzip / Brotli Compression
app.use(compression());

// CORS configuration (Strict domain check)
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(",").forEach((url) => {
    const trimmed = url.trim().replace(/\/$/, "");
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        (process.env.NODE_ENV !== "production" && origin.includes("localhost"))
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-revalidate-secret"],
  })
);

// Global rate limiting
app.use(globalLimiter);

// Parsers with 100kb payload limit for JSON
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

// NoSQL Injection Sanitization & HTTP Parameter Pollution protection
app.use(mongoSanitize());
app.use(hpp());

// Local uploads static serving (fallback when Cloudinary is not used)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// GET /health check endpoint for Render
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/upload", uploadRoutes);

// Central Error Handler (never leaks stack traces in production)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Central Error Caught:", err.message || err);
  if (process.env.NODE_ENV === "production") {
    res.status(err.status || 500).json({
      error: err.message || "An internal server error occurred",
    });
  } else {
    res.status(err.status || 500).json({
      error: err.message || "An internal server error occurred",
      stack: err.stack,
    });
  }
});

// Start Server & Connect Database
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Insertix Backend running in ${process.env.NODE_ENV || "development"} on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start backend server:", err);
  process.exit(1);
});
