import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const screenshotsDir = path.join(process.cwd(), "public", "screenshots");

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "tablet-1024", width: 1024, height: 768 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "mobile-390", width: 390, height: 844 },
];

async function capture() {
  console.log("Launching Edge headless browser...");
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

  // 1. Viewport captures
  for (const vp of VIEWPORTS) {
    console.log(`Capturing viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });

    await page.goto("http://localhost:3000", {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });
    await page.waitForFunction(() => !document.getElementById("global-preloader"), { timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 600));

    const heroPath = path.join(screenshotsDir, `${vp.name}-hero.png`);
    await page.screenshot({ path: heroPath, fullPage: false });
    console.log(`Saved: ${heroPath}`);

    const fullPath = path.join(screenshotsDir, `${vp.name}-full.png`);
    await page.screenshot({ path: fullPath, fullPage: true });
    console.log(`Saved: ${fullPath}`);

    await page.close();
  }

  // 2. Desktop Section Screenshots (1440px)
  console.log("Capturing section screenshots on desktop (1440px)...");
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto("http://localhost:3000", {
    waitUntil: "domcontentloaded",
    timeout: 25000,
  });
  await page.waitForFunction(() => !document.getElementById("global-preloader"), { timeout: 10000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 600));

  const sections = ["hero", "work", "about", "members", "recent-work", "testimonials", "contact"];
  for (const sec of sections) {
    const el = await page.$(`#${sec}`);
    if (el) {
      const secPath = path.join(screenshotsDir, `desktop-section-${sec}.png`);
      await el.screenshot({ path: secPath });
      console.log(`Saved section screenshot: ${secPath}`);
    }
  }

  // Recent Work with Filter clicked (e.g., Photo filter)
  console.log("Capturing Recent Work with 'Photo' filter clicked...");
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const photoBtn = buttons.find((b) => b.textContent && b.textContent.trim() === "Photo");
    if (photoBtn) {
      photoBtn.click();
      return true;
    }
    return false;
  });
  if (clicked) {
    await new Promise((r) => setTimeout(r, 600));
    const recentWorkEl = await page.$("#recent-work");
    if (recentWorkEl) {
      const filterPath = path.join(screenshotsDir, "desktop-recent-work-filtered-photo.png");
      await recentWorkEl.screenshot({ path: filterPath });
      console.log(`Saved filter screenshot: ${filterPath}`);
    }
  }

  // Mobile Section Screenshots (390px)
  console.log("Capturing section screenshots on mobile (390px)...");
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => !document.getElementById("global-preloader"), { timeout: 10000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 600));

  for (const sec of sections) {
    const el = await page.$(`#${sec}`);
    if (el) {
      const secPath = path.join(screenshotsDir, `mobile-section-${sec}.png`);
      await el.screenshot({ path: secPath });
      console.log(`Saved mobile section screenshot: ${secPath}`);
    }
  }

  // 3. Admin panel screenshot
  console.log("Capturing Admin Panel screenshot...");
  const adminPage = await browser.newPage();
  await adminPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // First log in to admin
  await adminPage.goto("http://localhost:3000/admin/login", { waitUntil: "domcontentloaded" });
  await adminPage.waitForSelector("input[type='email']", { timeout: 5000 }).catch(() => {});
  await adminPage.type("input[type='email']", "admin@insertixmedia.com");
  await adminPage.type("input[type='password']", "admin123");
  const submitBtn = await adminPage.$("button[type='submit']");
  if (submitBtn) {
    await submitBtn.click();
    await new Promise((r) => setTimeout(r, 1200));
  }

  await adminPage.goto("http://localhost:3000/admin", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 800));
  const adminPath = path.join(screenshotsDir, "desktop-admin-dashboard.png");
  await adminPage.screenshot({ path: adminPath, fullPage: false });
  console.log(`Saved admin screenshot: ${adminPath}`);

  await browser.close();
  console.log("All viewport and section screenshots captured successfully!");
}

capture().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
