import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const screenshotsDir = path.join(process.cwd(), "public", "screenshots");

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function run() {
  console.log("Launching Edge for carousel hover testing...");
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--window-size=1440,900",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  console.log("Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", {
    waitUntil: "domcontentloaded",
    timeout: 25000,
  });

  await page.waitForFunction(() => !document.getElementById("global-preloader"), { timeout: 10000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 800));

  // 1. SERVICES CARD HOVER
  console.log("Testing Services carousel hover...");
  const servicesSec = await page.$("#work");
  if (servicesSec) {
    await servicesSec.scrollIntoView();
    await new Promise((r) => setTimeout(r, 600));

    // Get cards in Services carousel
    const cards = await page.$$("#work .brand-card");
    console.log(`Found ${cards.length} cards in Services carousel`);
    if (cards.length > 1) {
      const targetCard = cards[1]; // 2nd card
      const box = await targetCard.boundingBox();
      if (box) {
        // Move mouse to center of the target card
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await new Promise((r) => setTimeout(r, 300)); // allow 180ms hover transition

        const hoverShotPath = path.join(screenshotsDir, "services-card-hover.png");
        // Screenshot the carousel region
        await servicesSec.screenshot({ path: hoverShotPath });
        console.log(`Saved: ${hoverShotPath}`);
      }
    }
  }

  // 2. RECENT WORK CARD HOVER
  console.log("Testing Recent Work carousel hover...");
  const workSec = await page.$("#recent-work");
  if (workSec) {
    await workSec.scrollIntoView();
    await new Promise((r) => setTimeout(r, 600));

    const cards = await page.$$("#recent-work .brand-card");
    console.log(`Found ${cards.length} cards in Recent Work carousel`);
    if (cards.length > 0) {
      const targetCard = cards[0];
      const box = await targetCard.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await new Promise((r) => setTimeout(r, 300));

        const hoverShotPath = path.join(screenshotsDir, "recent-work-card-hover.png");
        await workSec.screenshot({ path: hoverShotPath });
        console.log(`Saved: ${hoverShotPath}`);
      }
    }
  }

  // 3. TESTIMONIALS CARD HOVER
  console.log("Testing Testimonials carousel hover...");
  const testSec = await page.$("#testimonials");
  if (testSec) {
    await testSec.scrollIntoView();
    await new Promise((r) => setTimeout(r, 600));

    const cards = await page.$$("#testimonials .brand-card");
    console.log(`Found ${cards.length} cards in Testimonials carousel`);
    if (cards.length > 1) {
      const targetCard = cards[1];
      const box = await targetCard.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await new Promise((r) => setTimeout(r, 300));

        const hoverShotPath = path.join(screenshotsDir, "testimonials-card-hover.png");
        await testSec.screenshot({ path: hoverShotPath });
        console.log(`Saved: ${hoverShotPath}`);
      }
    }
  }

  // Verify track animation play state while hovered
  const isPlaying = await page.evaluate(() => {
    const track = document.querySelector("#testimonials .animate-marquee-left");
    if (!track) return false;
    const style = window.getComputedStyle(track);
    return style.animationPlayState;
  });
  console.log("Marquee animationPlayState while card hovered:", isPlaying);

  await browser.close();
  console.log("Hover test completed successfully!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
