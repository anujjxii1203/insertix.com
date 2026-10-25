import sharp from "sharp";
import fs from "fs";
import path from "path";

const assetsDir = path.join(process.cwd(), "public", "assets");
const publicDir = path.join(process.cwd(), "public");

async function optimizeImages() {
  console.log("Starting image optimization with sharp...\n");
  const report = [];

  const files = fs.readdirSync(assetsDir);

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp", ".heic"].includes(ext)) continue;

    const inputPath = path.join(assetsDir, file);
    const statBefore = fs.statSync(inputPath);
    const sizeBeforeKb = Math.round(statBefore.size / 1024);

    const baseName = path.basename(file, ext);
    const outputPath = path.join(assetsDir, `${baseName}.webp`);

    let resizeWidth = 1000;
    let quality = 78;

    if (file.startsWith("team-")) {
      // Member photo: max 400px wide, under 30KB limit
      resizeWidth = 400;
      quality = 75;
    } else if (file.startsWith("logo")) {
      resizeWidth = 500;
      quality = 80;
    } else {
      // Generic photo: max 1000px wide, under 100KB limit
      resizeWidth = 1000;
      quality = 75;
    }

    try {
      let pipeline = sharp(inputPath);

      // Handle EXIF orientation and strip metadata
      pipeline = pipeline.rotate();

      if (file.startsWith("team-")) {
        // Square or 4:5 portrait crop for avatar consistency
        pipeline = pipeline.resize(400, 500, { fit: "cover", position: "top" });
      } else {
        pipeline = pipeline.resize({ width: resizeWidth, withoutEnlargement: true });
      }

      await pipeline
        .webp({ quality, effort: 6 })
        .toFile(outputPath);

      const statAfter = fs.statSync(outputPath);
      const sizeAfterKb = Math.round(statAfter.size / 1024);

      report.push({
        file: file,
        outputFile: `${baseName}.webp`,
        before: `${sizeBeforeKb} KB`,
        after: `${sizeAfterKb} KB`,
        savings: `${Math.round(((statBefore.size - statAfter.size) / statBefore.size) * 100)}%`,
      });

      // If output file is different from input file, delete original heavy file
      if (inputPath !== outputPath) {
        fs.unlinkSync(inputPath);
      }
    } catch (err) {
      console.error(`Failed to process ${file}:`, err.message);
    }
  }

  // Update data/db.json to reference the optimized .webp files
  const dbPath = path.join(process.cwd(), "data", "db.json");
  if (fs.existsSync(dbPath)) {
    let dbContent = fs.readFileSync(dbPath, "utf-8");
    dbContent = dbContent
      .replace(/\/assets\/team-1\.jpg/g, "/assets/team-1.webp")
      .replace(/\/assets\/team-2\.jpg/g, "/assets/team-2.webp")
      .replace(/\/assets\/team-3\.jpg/g, "/assets/team-3.webp")
      .replace(/\/assets\/team-4\.jpg/g, "/assets/team-4.webp")
      .replace(/\/assets\/team-5\.jpg/g, "/assets/team-5.webp");
    fs.writeFileSync(dbPath, dbContent, "utf-8");
    console.log("Updated data/db.json references to .webp assets.");
  }

  console.log("\n════════ IMAGE OPTIMIZATION REPORT ════════");
  console.table(report);

  // Write report to markdown file as well
  const reportMd = report
    .map((r) => `| \`${r.file}\` | \`${r.outputFile}\` | ${r.before} | ${r.after} | ${r.savings} |`)
    .join("\n");

  const mdContent = `# Image Optimization Report\n\n| Original File | Optimized File | Size Before | Size After | Reduction |\n| :--- | :--- | :--- | :--- | :--- |\n${reportMd}\n`;
  fs.writeFileSync(path.join(process.cwd(), "OPTIMIZED_IMAGES.md"), mdContent, "utf-8");
  console.log("Report saved to OPTIMIZED_IMAGES.md");
}

optimizeImages().catch(console.error);
