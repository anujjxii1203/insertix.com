import { Router, Request, Response } from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { requireAuth } from "../middleware/auth";
import { uploadLimiter } from "../middleware/rateLimit";
import { cloudinary } from "../config/cloudinary";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB
  },
  fileFilter: (_req, file, cb) => {
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

      // Resize and compress with sharp to WebP
      const processedBuffer = await sharp(file.buffer)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 80, effort: 6 })
        .toBuffer();

      // If Cloudinary credentials are set in environment, upload to Cloudinary
      if (
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ) {
        return new Promise<void>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "insertix",
              resource_type: "image",
              format: "webp",
            },
            (error, result) => {
              if (error || !result) {
                console.error("Cloudinary upload failed:", error);
                res.status(500).json({ error: "Cloudinary upload failed" });
                return resolve();
              }
              res.json({
                success: true,
                url: result.secure_url,
              });
              resolve();
            }
          );
          uploadStream.end(processedBuffer);
        });
      }

      // Local fallback for local development only
      const uploadsDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}.webp`;
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
