import puppeteer from "puppeteer-core";
import path from "path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outDir = "C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\8eeaa8fd-d283-44b4-bba8-1161338925b5";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  // Desktop 1440
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await desktopPage.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 25000 });
  await new Promise((r) => setTimeout(r, 2600));

  const desktopHero = path.join(outDir, "recheck_desktop_hero_1440.png");
  await desktopPage.screenshot({ path: desktopHero });
  console.log("Saved:", desktopHero);

  // Mobile 390
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await mobilePage.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 25000 });
  await new Promise((r) => setTimeout(r, 2600));

  const mobileHero = path.join(outDir, "recheck_mobile_hero_390.png");
  await mobilePage.screenshot({ path: mobileHero });
  console.log("Saved:", mobileHero);

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
