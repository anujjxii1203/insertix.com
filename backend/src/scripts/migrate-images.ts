import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load backend env or root env
dotenv.config();
dotenv.config({ path: path.join(__dirname, "../../../.env.local") });

import {
  getProjects,
  updateProject,
  getTeamMembers,
  updateTeamMember,
  getTestimonials,
  updateTestimonial,
  connectDB,
} from "../config/db";

interface MigrationRow {
  collection: string;
  id: string;
  titleOrName: string;
  field: string;
  oldPath: string;
  newUrl?: string;
  status: "UPLOADED" | "ALREADY_REMOTE" | "MISSING_LOCAL_FILE" | "FAILED" | "SKIPPED_NO_CREDS";
  error?: string;
}

async function uploadFileToCloudinary(localPath: string): Promise<string> {
  const result = await cloudinary.uploader.upload(localPath, {
    folder: "insertix",
    resource_type: "image",
    format: "webp",
    transformation: [{ quality: "auto:good", fetch_format: "webp" }],
  });
  return result.secure_url;
}

function resolveLocalFilePath(imagePath: string): string | null {
  // Candidate locations where uploads/assets might live
  const normalized = imagePath.replace(/^\/+/, ""); // e.g. uploads/xyz.webp or assets/xyz.webp
  const candidates = [
    path.join(process.cwd(), "..", "public", normalized),
    path.join(process.cwd(), "uploads", path.basename(normalized)),
    path.join(process.cwd(), "..", "uploads", path.basename(normalized)),
    path.join(process.cwd(), "..", normalized),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  return null;
}

async function run() {
  console.log("=================================================");
  console.log("📦 Cloudinary Image Migration Script");
  console.log("=================================================\n");

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const hasCloudinary = Boolean(cloudName && apiKey && apiSecret);

  if (!hasCloudinary) {
    console.warn("⚠️  WARNING: Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not set.");
    console.warn("Running in DRY-RUN / INVENTORY mode only. Local files will be identified without uploading.\n");
  } else {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    console.log(`✅ Configured Cloudinary for cloud: ${cloudName}\n`);
  }

  await connectDB();

  const report: MigrationRow[] = [];

  // 1. Projects
  const projects = await getProjects(false);
  for (const proj of projects) {
    const rawPath = proj.coverImage;
    if (!rawPath) continue;

    if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
      report.push({
        collection: "projects",
        id: proj.id,
        titleOrName: proj.title,
        field: "coverImage",
        oldPath: rawPath,
        newUrl: rawPath,
        status: "ALREADY_REMOTE",
      });
      continue;
    }

    const localFile = resolveLocalFilePath(rawPath);
    if (!localFile) {
      report.push({
        collection: "projects",
        id: proj.id,
        titleOrName: proj.title,
        field: "coverImage",
        oldPath: rawPath,
        status: "MISSING_LOCAL_FILE",
        error: "File not found in local public/ or uploads/ directory",
      });
      continue;
    }

    if (!hasCloudinary) {
      report.push({
        collection: "projects",
        id: proj.id,
        titleOrName: proj.title,
        field: "coverImage",
        oldPath: rawPath,
        status: "SKIPPED_NO_CREDS",
      });
      continue;
    }

    try {
      console.log(`Uploading project '${proj.title}' image: ${localFile}...`);
      const newUrl = await uploadFileToCloudinary(localFile);
      await updateProject(proj.id, { coverImage: newUrl });
      report.push({
        collection: "projects",
        id: proj.id,
        titleOrName: proj.title,
        field: "coverImage",
        oldPath: rawPath,
        newUrl,
        status: "UPLOADED",
      });
    } catch (err: any) {
      report.push({
        collection: "projects",
        id: proj.id,
        titleOrName: proj.title,
        field: "coverImage",
        oldPath: rawPath,
        status: "FAILED",
        error: err.message,
      });
    }
  }

  // 2. Team Members
  const team = await getTeamMembers(false);
  for (const member of team) {
    const rawPath = member.avatar;
    if (!rawPath) continue;

    if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
      report.push({
        collection: "team",
        id: member.id,
        titleOrName: member.name,
        field: "avatar",
        oldPath: rawPath,
        newUrl: rawPath,
        status: "ALREADY_REMOTE",
      });
      continue;
    }

    const localFile = resolveLocalFilePath(rawPath);
    if (!localFile) {
      report.push({
        collection: "team",
        id: member.id,
        titleOrName: member.name,
        field: "avatar",
        oldPath: rawPath,
        status: "MISSING_LOCAL_FILE",
        error: "File not found in local public/ or uploads/ directory",
      });
      continue;
    }

    if (!hasCloudinary) {
      report.push({
        collection: "team",
        id: member.id,
        titleOrName: member.name,
        field: "avatar",
        oldPath: rawPath,
        status: "SKIPPED_NO_CREDS",
      });
      continue;
    }

    try {
      console.log(`Uploading team member '${member.name}' avatar: ${localFile}...`);
      const newUrl = await uploadFileToCloudinary(localFile);
      await updateTeamMember(member.id, { avatar: newUrl });
      report.push({
        collection: "team",
        id: member.id,
        titleOrName: member.name,
        field: "avatar",
        oldPath: rawPath,
        newUrl,
        status: "UPLOADED",
      });
    } catch (err: any) {
      report.push({
        collection: "team",
        id: member.id,
        titleOrName: member.name,
        field: "avatar",
        oldPath: rawPath,
        status: "FAILED",
        error: err.message,
      });
    }
  }

  // 3. Testimonials
  const testimonials = await getTestimonials(false);
  for (const t of testimonials) {
    const rawPath = t.avatar;
    if (!rawPath) continue;

    if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
      report.push({
        collection: "testimonials",
        id: t.id,
        titleOrName: t.clientName,
        field: "avatar",
        oldPath: rawPath,
        newUrl: rawPath,
        status: "ALREADY_REMOTE",
      });
      continue;
    }

    const localFile = resolveLocalFilePath(rawPath);
    if (!localFile) {
      report.push({
        collection: "testimonials",
        id: t.id,
        titleOrName: t.clientName,
        field: "avatar",
        oldPath: rawPath,
        status: "MISSING_LOCAL_FILE",
        error: "File not found in local public/ or uploads/ directory",
      });
      continue;
    }

    if (!hasCloudinary) {
      report.push({
        collection: "testimonials",
        id: t.id,
        titleOrName: t.clientName,
        field: "avatar",
        oldPath: rawPath,
        status: "SKIPPED_NO_CREDS",
      });
      continue;
    }

    try {
      console.log(`Uploading testimonial '${t.clientName}' avatar: ${localFile}...`);
      const newUrl = await uploadFileToCloudinary(localFile);
      await updateTestimonial(t.id, { avatar: newUrl });
      report.push({
        collection: "testimonials",
        id: t.id,
        titleOrName: t.clientName,
        field: "avatar",
        oldPath: rawPath,
        newUrl,
        status: "UPLOADED",
      });
    } catch (err: any) {
      report.push({
        collection: "testimonials",
        id: t.id,
        titleOrName: t.clientName,
        field: "avatar",
        oldPath: rawPath,
        status: "FAILED",
        error: err.message,
      });
    }
  }

  console.log("\n=================================================");
  console.log("📊 MIGRATION SUMMARY TABLE");
  console.log("=================================================");
  console.table(
    report.map((r) => ({
      Collection: r.collection,
      Name: r.titleOrName.substring(0, 24),
      "Old Path": r.oldPath.substring(0, 30),
      Status: r.status,
      "New URL / Error": (r.newUrl || r.error || "-").substring(0, 40),
    }))
  );

  const missing = report.filter((r) => r.status === "MISSING_LOCAL_FILE");
  if (missing.length > 0) {
    console.warn(`\n⚠️  The following ${missing.length} files were missing on disk and could not be uploaded:`);
    missing.forEach((m) => console.warn(` - [${m.collection}] ${m.titleOrName}: ${m.oldPath}`));
  }

  process.exit(0);
}

run().catch((e) => {
  console.error("Migration error:", e);
  process.exit(1);
});
