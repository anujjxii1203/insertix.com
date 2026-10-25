import fs from "fs";
import path from "path";
import sharp from "sharp";

const projectsDir = path.join(process.cwd(), "public", "projects");
const assetsDir = path.join(process.cwd(), "public", "assets");

if (!fs.existsSync(projectsDir)) {
  fs.mkdirSync(projectsDir, { recursive: true });
}
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const imagesToDownload = [
  {
    name: "proj-video-1.webp",
    url: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1200&auto=format&fit=crop",
    destDir: projectsDir,
    width: 1000,
    height: 625,
  },
  {
    name: "proj-video-2.webp",
    url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop",
    destDir: projectsDir,
    width: 1000,
    height: 625,
  },
  {
    name: "proj-photo-1.webp",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop",
    destDir: projectsDir,
    width: 1000,
    height: 625,
  },
  {
    name: "proj-photo-2.webp",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop",
    destDir: projectsDir,
    width: 1000,
    height: 625,
  },
  {
    name: "proj-product-1.webp",
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop",
    destDir: projectsDir,
    width: 1000,
    height: 625,
  },
  {
    name: "proj-product-2.webp",
    url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop",
    destDir: projectsDir,
    width: 1000,
    height: 625,
  },
  {
    name: "proj-event-1.webp",
    url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop",
    destDir: projectsDir,
    width: 1000,
    height: 625,
  },
  {
    name: "proj-event-2.webp",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
    destDir: projectsDir,
    width: 1000,
    height: 625,
  },
  {
    name: "proj-marketing-1.webp",
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop",
    destDir: projectsDir,
    width: 1000,
    height: 625,
  },
  {
    name: "proj-marketing-2.webp",
    url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1200&auto=format&fit=crop",
    destDir: projectsDir,
    width: 1000,
    height: 625,
  },
  {
    name: "team-6.webp",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=500&auto=format&fit=crop",
    destDir: assetsDir,
    width: 400,
    height: 500,
  },
];

async function run() {
  console.log("Downloading and optimizing real royalty-free project assets...");
  for (const item of imagesToDownload) {
    try {
      console.log(`Fetching ${item.name} from Unsplash...`);
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const targetPath = path.join(item.destDir, item.name);
      await sharp(buffer)
        .rotate()
        .resize(item.width, item.height, { fit: "cover", position: "center" })
        .webp({ quality: 75, effort: 6 })
        .toFile(targetPath);

      const stat = fs.statSync(targetPath);
      const kb = Math.round(stat.size / 1024);
      console.log(`✅ Saved ${item.name} (${kb} KB - ${kb < 100 ? "UNDER 100KB" : "WARNING > 100KB"})`);
    } catch (err) {
      console.error(`❌ Failed downloading ${item.name}:`, err.message);
    }
  }
  console.log("All project images processed!");
}

run();
