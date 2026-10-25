import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const screenshotsDir = path.join(process.cwd(), "public", "screenshots");

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function run() {
  console.log("Launching Edge to capture hovered card proofs...");
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

  console.log("Loading http://localhost:3000...");
  await page.goto("http://localhost:3000", {
    waitUntil: "domcontentloaded",
    timeout: 25000,
  });

  await page.waitForFunction(() => !document.getElementById("global-preloader"), { timeout: 10000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 800));

  // 1. SERVICES CARD HOVER
  console.log("Hovering Services card...");
  const servicesSec = await page.$("#work");
  if (servicesSec) {
    await servicesSec.scrollIntoView();
    await new Promise((r) => setTimeout(r, 500));
    const cards = await page.$$("#work .brand-card");
    if (cards.length > 1) {
      const target = cards[1];
      const box = await target.boundingBox();
      if (box) {
        // Hover inside the card
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await new Promise((r) => setTimeout(r, 300));
        const outPath = path.join(screenshotsDir, "proof-services-card-hover.png");
        await target.screenshot({ path: outPath });
        console.log(`Saved: ${outPath}`);
      }
    }
  }

  // 2. ABOUT STATS CARD HOVER
  console.log("Hovering About Stats card...");
  const aboutSec = await page.$("#about");
  if (aboutSec) {
    await aboutSec.scrollIntoView();
    await new Promise((r) => setTimeout(r, 500));
    const statCards = await page.$$("#about .brand-card");
    if (statCards.length > 1) {
      const target = statCards[1]; // "Happy Clients" (65+)
      const box = await target.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await new Promise((r) => setTimeout(r, 300));
        const outPath = path.join(screenshotsDir, "proof-about-stats-card-hover.png");
        await target.screenshot({ path: outPath });
        console.log(`Saved: ${outPath}`);
      }
    }
  }

  // 3. MEMBERS / TEAM CARD HOVER
  console.log("Hovering Members card...");
  const teamSec = await page.$("#members");
  if (teamSec) {
    await teamSec.scrollIntoView();
    await new Promise((r) => setTimeout(r, 500));
    const memberCards = await page.$$("#members .brand-card");
    if (memberCards.length > 0) {
      const target = memberCards[0];
      const box = await target.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await new Promise((r) => setTimeout(r, 300));
        const outPath = path.join(screenshotsDir, "proof-members-card-hover.png");
        await target.screenshot({ path: outPath });
        console.log(`Saved: ${outPath}`);
      }
    }
  }

  // 4. RECENT WORK CARD HOVER
  console.log("Hovering Recent Work card...");
  const workSec = await page.$("#recent-work");
  if (workSec) {
    await workSec.scrollIntoView();
    await new Promise((r) => setTimeout(r, 500));
    const workCards = await page.$$("#recent-work .brand-card");
    if (workCards.length > 1) {
      const target = workCards[1];
      const box = await target.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await new Promise((r) => setTimeout(r, 300));
        const outPath = path.join(screenshotsDir, "proof-recent-work-card-hover.png");
        await target.screenshot({ path: outPath });
        console.log(`Saved: ${outPath}`);
      }
    }
  }

  // 5. TESTIMONIALS CARD HOVER
  console.log("Hovering Testimonials card...");
  const testSec = await page.$("#testimonials");
  if (testSec) {
    await testSec.scrollIntoView();
    await new Promise((r) => setTimeout(r, 500));
    const testCards = await page.$$("#testimonials .brand-card");
    if (testCards.length > 1) {
      const target = testCards[1];
      const box = await target.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await new Promise((r) => setTimeout(r, 300));
        const outPath = path.join(screenshotsDir, "proof-testimonials-card-hover.png");
        await target.screenshot({ path: outPath });
        console.log(`Saved: ${outPath}`);
      }
    }
  }

  await browser.close();
  console.log("All 5 card hover proof screenshots saved successfully!");
}

run().catch((err) => {
  console.error("Run error:", err);
  process.exit(1);
});
