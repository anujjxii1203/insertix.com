const puppeteer = require('puppeteer-core');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\db1008da-76e1-4cff-9242-6ae2564774ef';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  const viewports = [
    { width: 1440, height: 950, name: '1440' },
    { width: 1024, height: 900, name: '1024' },
    { width: 768, height: 1024, name: '768' },
    { width: 390, height: 844, name: '390' }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000/#contact', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));

    // Scroll to contact section
    await page.evaluate(() => {
      const el = document.getElementById('contact');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await new Promise(r => setTimeout(r, 600));

    // Screenshot of contact section specifically
    const contactElem = await page.$('#contact');
    if (contactElem) {
      await contactElem.screenshot({
        path: path.join(ARTIFACT_DIR, `contact_section_${vp.name}px.png`)
      });
      console.log(`Saved contact_section_${vp.name}px.png`);
    }
  }

  await browser.close();
  console.log('Finished capturing all responsive contact section screenshots.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
