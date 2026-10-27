const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function testMarquee() {
  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
  ];
  const executablePath = chromePaths.find(p => fs.existsSync(p));
  if (!executablePath) {
    console.log('No Chrome binary found, skipping headless run');
    return;
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const viewports = [320, 768, 1280, 1920, 2560];

  for (const w of viewports) {
    await page.setViewport({ width: w, height: 900 });
    await page.goto('http://localhost:3008', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.marquee-track');

    const metrics = await page.evaluate((vpWidth) => {
      const track = document.querySelector('.marquee-track');
      const groups = document.querySelectorAll('.marquee-group');
      const group1 = groups[0];
      const group2 = groups[1];
      const scrollWidth = document.documentElement.scrollWidth;
      const innerWidth = window.innerWidth;

      return {
        vpWidth,
        trackWidth: track ? track.scrollWidth : 0,
        group1Width: group1 ? group1.scrollWidth : 0,
        group2Width: group2 ? group2.scrollWidth : 0,
        hasHorizontalOverflow: scrollWidth > innerWidth,
        scrollWidth,
        innerWidth
      };
    }, w);

    console.log(
      'Viewport ' + w + 'px: group1Width=' + metrics.group1Width +
      'px (exceeds ' + w + 'px: ' + (metrics.group1Width > w) +
      '), scrollWidth=' + metrics.scrollWidth +
      ', innerWidth=' + metrics.innerWidth +
      ', pageOverflow=' + metrics.hasHorizontalOverflow
    );
  }

  await browser.close();
}

testMarquee().catch(console.error);
