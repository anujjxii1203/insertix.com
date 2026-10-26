import { Router, Request, Response } from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { requireAuth } from "../middleware/auth";
import { uploadLimiter } from "../middleware/rateLimit";
import { imagekit } from "../config/imagekit";

const router = Router();

// Magic bytes validation for jpeg, png, webp, avif
function validateMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }
  // WEBP: RIFF....WEBP
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return true;
  }
  // AVIF: ....ftypavif
  if (buffer.toString("ascii", 4, 12).includes("ftyp")) {
    return true;
  }

  return false;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowed = /jpeg|jpg|png|webp|avif/i.test(path.extname(file.originalname));
    const mime = /image\/(jpeg|png|webp|avif)/i.test(file.mimetype);
    if (allowed && mime) {
      cb(null, true);
    } else {
      cb(new Error("Only images (jpeg, png, webp, avif) are allowed"));
    }
  },
});

// POST /api/upload
router.post(
  "/",
  requireAuth,
  uploadLimiter,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Magic bytes verification
      if (!validateMagicBytes(file.buffer)) {
        return res.status(400).json({ error: "Invalid image file header" });
      }

      // Resize and compress with sharp (WebP, max 1600px, quality 78)
      const processedBuffer = await sharp(file.buffer)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 78, effort: 6 })
        .toBuffer();

      const safeName = `${Date.now()}-${file.originalname
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .replace(/\.[^/.]+$/, "")}.webp`;

      // Upload to ImageKit if configured
      if (imagekit) {
        try {
          const uploadRes = await imagekit.upload({
            file: processedBuffer,
            fileName: safeName,
            folder: "/insertix",
            useUniqueFileName: true,
          });

          return res.json({
            success: true,
            url: uploadRes.url,
          });
        } catch (ikError: any) {
          console.error("ImageKit upload failed:", ikError);
          return res.status(500).json({ error: "ImageKit upload failed" });
        }
      }

      // Local fallback for local development only
      const uploadsDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, processedBuffer);

      return res.json({
        success: true,
        url: `/uploads/${safeName}`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({ error: "Image processing failed" });
    }
  }
);

export default router;
