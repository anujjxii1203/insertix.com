import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed." },
        { status: 400 }
      );
    }

    // Reject files over 5MB
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 5MB maximum upload limit" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const cleanBaseName = path
      .basename(file.name, path.extname(file.name))
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeName = `${Date.now()}-${cleanBaseName}.webp`;

    // Process image in memory with sharp
    const optimizedBuffer = await sharp(buffer)
      .rotate() // Respect EXIF orientation
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 78, effort: 6, force: true })
      .toBuffer();

    const imagekitPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (imagekitPrivateKey && imagekitPrivateKey.trim() !== "") {
      // Cloud storage on ImageKit CDN
      const ikFormData = new FormData();
      ikFormData.append("file", new Blob([optimizedBuffer], { type: "image/webp" }), safeName);
      ikFormData.append("fileName", safeName);
      ikFormData.append("useUniqueFileName", "true");
      ikFormData.append("folder", "/uploads");

      const authHeader = "Basic " + Buffer.from(imagekitPrivateKey + ":").toString("base64");
      const ikRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
        body: ikFormData,
      });

      if (ikRes.ok) {
        const ikData = await ikRes.json();
        return NextResponse.json({
          success: true,
          url: ikData.url,
        });
      }
      console.warn("ImageKit direct upload failed, checking local fs fallback...");
    }

    // In production without ImageKit or local storage, fail clearly instead of attempting read-only fs write
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Upload failed: ImageKit is not configured in production environment" },
        { status: 500 }
      );
    }

    // Dev environment fallback to local public/uploads
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, optimizedBuffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${safeName}`,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error?.message || "Upload failed" }, { status: 500 });
  }
}
