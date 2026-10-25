import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outDir = "C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\8eeaa8fd-d283-44b4-bba8-1161338925b5";

const VIEWPORTS = [
  { name: "footer_desktop_1440", width: 1440, height: 900 },
  { name: "footer_laptop_1024", width: 1024, height: 768 },
  { name: "footer_tablet_768", width: 768, height: 1024 },
  { name: "footer_mobile_390", width: 390, height: 844 },
];

async function run() {
  console.log("Launching Edge headless...");
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  for (const vp of VIEWPORTS) {
    console.log(`Processing ${vp.name}...`);
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });

    await page.goto("http://localhost:3000", {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });

    // Wait for preloader to finish
    await new Promise((r) => setTimeout(r, 2600));

    // Scroll to footer
    await page.evaluate(() => {
      const footer = document.querySelector("footer");
      if (footer) footer.scrollIntoView({ behavior: "instant" });
    });

    await new Promise((r) => setTimeout(r, 600));

    const footerElement = await page.$("footer");
    if (footerElement) {
      const savePath = path.join(outDir, `${vp.name}.png`);
      await footerElement.screenshot({ path: savePath });
      console.log(`Saved screenshot to ${savePath}`);
    } else {
      console.error("Footer element not found!");
    }

    await page.close();
  }

  // Also verify /admin page opens directly
  console.log("Verifying /admin route directly...");
  const adminPage = await browser.newPage();
  await adminPage.setViewport({ width: 1440, height: 900 });
  await adminPage.goto("http://localhost:3000/admin", {
    waitUntil: "domcontentloaded",
    timeout: 20000,
  });
  await new Promise((r) => setTimeout(r, 1500));
  const currentUrl = adminPage.url();
  console.log(`Admin route accessed. Final URL (auth redirect or dashboard): ${currentUrl}`);
  await adminPage.close();

  await browser.close();
  console.log("Finished successfully.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
