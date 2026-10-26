import ImageKit from "imagekit";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import sharp from "sharp";

// Load backend env or root env
dotenv.config();
dotenv.config({ path: path.join(__dirname, "../../../.env.local") });
dotenv.config({ path: path.join(__dirname, "../../../atlas-credentials.env") });

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
  fileFound: "YES" | "NO";
  newUrl?: string;
  status: "UPLOADED" | "ALREADY_REMOTE" | "MISSING_LOCAL_FILE" | "DRY_RUN_READY" | "FAILED" | "SKIPPED_NO_CREDS";
  error?: string;
}

function resolveLocalFilePath(imagePath: string): string | null {
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
  console.log("📦 ImageKit Image Migration Script");
  console.log("=================================================\n");

  const isRealRun = process.argv.includes("--execute");

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  const hasImageKit = Boolean(publicKey && privateKey && urlEndpoint);

  let imagekit: ImageKit | null = null;

  if (!hasImageKit) {
    console.warn("⚠️  WARNING: ImageKit environment variables (IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT) are not set.");
    console.warn("Running in DRY-RUN / INVENTORY mode only. Local files will be checked without uploading.\n");
  } else {
    imagekit = new ImageKit({
      publicKey: publicKey!,
      privateKey: privateKey!,
      urlEndpoint: urlEndpoint!,
    });
    console.log(`✅ Configured ImageKit Endpoint: ${urlEndpoint}\n`);
    if (!isRealRun) {
      console.log("ℹ️  Running in DRY RUN mode. Pass '--execute' to perform real uploads and DB updates.\n");
    }
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
        fileFound: "YES",
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
        fileFound: "NO",
        status: "MISSING_LOCAL_FILE",
        error: "File not found in local public/ or uploads/ directory",
      });
      continue;
    }

    if (!hasImageKit || !isRealRun) {
      report.push({
        collection: "projects",
        id: proj.id,
        titleOrName: proj.title,
        field: "coverImage",
        oldPath: rawPath,
        fileFound: "YES",
        status: hasImageKit ? "DRY_RUN_READY" : "SKIPPED_NO_CREDS",
      });
      continue;
    }

    try {
      console.log(`Uploading project '${proj.title}' image: ${localFile}...`);
      const fileBuffer = fs.readFileSync(localFile);
      const processedBuffer = await sharp(fileBuffer)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 78, effort: 6 })
        .toBuffer();

      const uploadRes = await imagekit!.upload({
        file: processedBuffer,
        fileName: path.basename(localFile),
        folder: "/insertix",
        useUniqueFileName: true,
      });

      await updateProject(proj.id, { coverImage: uploadRes.url });
      report.push({
        collection: "projects",
        id: proj.id,
        titleOrName: proj.title,
        field: "coverImage",
        oldPath: rawPath,
        fileFound: "YES",
        newUrl: uploadRes.url,
        status: "UPLOADED",
      });
    } catch (err: any) {
      report.push({
        collection: "projects",
        id: proj.id,
        titleOrName: proj.title,
        field: "coverImage",
        oldPath: rawPath,
        fileFound: "YES",
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
        fileFound: "YES",
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
        fileFound: "NO",
        status: "MISSING_LOCAL_FILE",
        error: "File not found in local public/ or uploads/ directory",
      });
      continue;
    }

    if (!hasImageKit || !isRealRun) {
      report.push({
        collection: "team",
        id: member.id,
        titleOrName: member.name,
        field: "avatar",
        oldPath: rawPath,
        fileFound: "YES",
        status: hasImageKit ? "DRY_RUN_READY" : "SKIPPED_NO_CREDS",
      });
      continue;
    }

    try {
      console.log(`Uploading team member '${member.name}' avatar: ${localFile}...`);
      const fileBuffer = fs.readFileSync(localFile);
      const processedBuffer = await sharp(fileBuffer)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 78, effort: 6 })
        .toBuffer();

      const uploadRes = await imagekit!.upload({
        file: processedBuffer,
        fileName: path.basename(localFile),
        folder: "/insertix",
        useUniqueFileName: true,
      });

      await updateTeamMember(member.id, { avatar: uploadRes.url });
      report.push({
        collection: "team",
        id: member.id,
        titleOrName: member.name,
        field: "avatar",
        oldPath: rawPath,
        fileFound: "YES",
        newUrl: uploadRes.url,
        status: "UPLOADED",
      });
    } catch (err: any) {
      report.push({
        collection: "team",
        id: member.id,
        titleOrName: member.name,
        field: "avatar",
        oldPath: rawPath,
        fileFound: "YES",
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
        fileFound: "YES",
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
        fileFound: "NO",
        status: "MISSING_LOCAL_FILE",
        error: "File not found in local public/ or uploads/ directory",
      });
      continue;
    }

    if (!hasImageKit || !isRealRun) {
      report.push({
        collection: "testimonials",
        id: t.id,
        titleOrName: t.clientName,
        field: "avatar",
        oldPath: rawPath,
        fileFound: "YES",
        status: hasImageKit ? "DRY_RUN_READY" : "SKIPPED_NO_CREDS",
      });
      continue;
    }

    try {
      console.log(`Uploading testimonial '${t.clientName}' avatar: ${localFile}...`);
      const fileBuffer = fs.readFileSync(localFile);
      const processedBuffer = await sharp(fileBuffer)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 78, effort: 6 })
        .toBuffer();

      const uploadRes = await imagekit!.upload({
        file: processedBuffer,
        fileName: path.basename(localFile),
        folder: "/insertix",
        useUniqueFileName: true,
      });

      await updateTestimonial(t.id, { avatar: uploadRes.url });
      report.push({
        collection: "testimonials",
        id: t.id,
        titleOrName: t.clientName,
        field: "avatar",
        oldPath: rawPath,
        fileFound: "YES",
        newUrl: uploadRes.url,
        status: "UPLOADED",
      });
    } catch (err: any) {
      report.push({
        collection: "testimonials",
        id: t.id,
        titleOrName: t.clientName,
        field: "avatar",
        oldPath: rawPath,
        fileFound: "YES",
        status: "FAILED",
        error: err.message,
      });
    }
  }

  console.log("\n=================================================");
  console.log("📊 IMAGEKIT MIGRATION SUMMARY TABLE");
  console.log("=================================================");
  console.table(
    report.map((r) => ({
      Collection: r.collection,
      Name: r.titleOrName.substring(0, 22),
      "Old Path": r.oldPath.substring(0, 28),
      "File Found?": r.fileFound,
      Status: r.status,
      "New URL / Error": (r.newUrl || r.error || "-").substring(0, 40),
    }))
  );

  const missing = report.filter((r) => r.status === "MISSING_LOCAL_FILE");
  if (missing.length > 0) {
    console.warn(`\n⚠️  The following ${missing.length} files were missing on disk:`);
    missing.forEach((m) => console.warn(` - [${m.collection}] ${m.titleOrName}: ${m.oldPath}`));
  }

  process.exit(0);
}

run().catch((e) => {
  console.error("Migration error:", e);
  process.exit(1);
});
