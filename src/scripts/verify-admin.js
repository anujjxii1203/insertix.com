const puppeteer = require('puppeteer-core');
const fs = require('fs');
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

  // 1. Admin Login Page (Desktop 1440x900)
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  const loginPath = path.join(ARTIFACT_DIR, 'admin_login_desktop.png');
  await page.screenshot({ path: loginPath });
  console.log('Saved admin_login_desktop.png');

  // Fill valid login credentials: admin@insertixmedia.com / admin123
  await page.type('input[type="email"]', 'admin@insertixmedia.com');
  await page.type('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  // Wait for redirect to /admin
  await page.waitForFunction(() => window.location.pathname === '/admin', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));
  console.log('Successfully logged into /admin');

  // Helper to click tab by text
  const clickTab = async (text) => {
    await page.evaluate((targetText) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes(targetText));
      if (btn) btn.click();
    }, text);
    await new Promise(r => setTimeout(r, 1200));
  };

  // 2. Tab: Projects (Desktop 1440x900)
  await clickTab('Projects');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_tab_projects_desktop.png') });
  console.log('Saved admin_tab_projects_desktop.png');

  // 3. Tab: Team (Desktop 1440x900)
  await clickTab('Team');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_tab_team_desktop.png') });
  console.log('Saved admin_tab_team_desktop.png');

  // 4. Tab: Testimonials (Desktop 1440x900)
  await clickTab('Testimonials');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_tab_testimonials_desktop.png') });
  console.log('Saved admin_tab_testimonials_desktop.png');

  // 5. Tab: Inquiries (Desktop 1440x900)
  await clickTab('Inquiries');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_tab_inquiries_desktop.png') });
  console.log('Saved admin_tab_inquiries_desktop.png');

  // 6. Mobile View (390x844) for Projects and Inquiries
  await page.setViewport({ width: 390, height: 844 });
  await clickTab('Projects');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_tab_projects_mobile.png') });
  console.log('Saved admin_tab_projects_mobile.png');

  await clickTab('Inquiries');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_tab_inquiries_mobile.png') });
  console.log('Saved admin_tab_inquiries_mobile.png');

  // 7. Live Sync Test:
  // Open main website in second page tab
  const mainPage = await browser.newPage();
  await mainPage.setViewport({ width: 1440, height: 900 });
  await mainPage.goto('http://localhost:3000/#work', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await mainPage.screenshot({ path: path.join(ARTIFACT_DIR, 'mainsite_before_live_update.png') });
  console.log('Saved mainsite_before_live_update.png');

  // On admin page (desktop 1440), create a distinctive project via authenticated fetch
  await page.setViewport({ width: 1440, height: 900 });
  await clickTab('Projects');

  await page.evaluate(async () => {
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Alpha Live Stream Showcase',
        category: 'video',
        client: 'Insertix Studio Pro',
        year: '2026',
        description: 'Ultra high definition live multicam stream and cinematic broadcast capture.',
        image: '/projects/proj-video-1.webp',
        tags: ['Live', 'Cinematic'],
        featured: true,
        visible: true,
        order: 0
      })
    });
  });

  console.log('Created project Alpha Live Stream Showcase in admin');
  // Wait 2 seconds for SSE event to push to mainPage
  await new Promise(r => setTimeout(r, 2500));

  // Take screenshot of mainPage showing live update without page refresh
  await mainPage.screenshot({ path: path.join(ARTIFACT_DIR, 'mainsite_after_live_update.png') });
  console.log('Saved mainsite_after_live_update.png');

  // Clean up the created test project
  await page.evaluate(async () => {
    const res = await fetch('/api/projects?admin=true');
    const items = await res.json();
    const created = items.find(p => p.title === 'Alpha Live Stream Showcase');
    if (created) {
      await fetch('/api/projects/' + created.id, { method: 'DELETE' });
    }
  });

  await browser.close();
  console.log('All verification tasks finished successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
