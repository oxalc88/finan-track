import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const screenshotsDir = join(__dirname, 'screenshots');

// Ensure screenshots directory exists
if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
}

async function takeScreenshots() {
  console.log('Launching browser...');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--single-process',
      '--no-zygote',
    ],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    console.log('Navigating to dashboard...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log('1/8 - Capturing full dashboard...');
    await page.screenshot({
      path: join(screenshotsDir, '01-full-dashboard.png'),
      fullPage: true,
    });

    console.log('2/8 - Capturing overview cards...');
    const overviewSection = await page.locator('section').first();
    await overviewSection.screenshot({
      path: join(screenshotsDir, '02-overview-cards.png'),
    });

    console.log('3/8 - Capturing accounts and investments...');
    const accountsSection = await page.locator('section').nth(1);
    await accountsSection.screenshot({
      path: join(screenshotsDir, '03-accounts-investments.png'),
    });

    console.log('4/8 - Capturing debt and credit cards...');
    const debtSection = await page.locator('section').nth(2);
    await debtSection.screenshot({
      path: join(screenshotsDir, '04-debt-credit-cards.png'),
    });

    console.log('5/8 - Capturing cash flow insights...');
    const cashFlowSection = await page.locator('section').nth(3);
    await cashFlowSection.screenshot({
      path: join(screenshotsDir, '05-cash-flow-insights.png'),
    });

    console.log('6/8 - Capturing notifications...');
    const notificationsSection = await page.locator('section').nth(4);
    await notificationsSection.screenshot({
      path: join(screenshotsDir, '06-notifications-alerts.png'),
    });

    // Mobile view - Home
    console.log('7/11 - Capturing mobile home view...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: join(screenshotsDir, '07-mobile-home.png'),
      fullPage: true,
    });

    // Mobile view - Credit Cards Detail
    console.log('8/11 - Capturing mobile credit cards...');
    await page.goto('http://localhost:3000/credit-cards', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: join(screenshotsDir, '08-mobile-credit-cards.png'),
      fullPage: true,
    });

    // Mobile view - Accounts Detail
    console.log('9/11 - Capturing mobile accounts...');
    await page.goto('http://localhost:3000/accounts', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: join(screenshotsDir, '09-mobile-accounts.png'),
      fullPage: true,
    });

    // Tablet view
    console.log('10/11 - Capturing tablet view...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: join(screenshotsDir, '10-tablet-view.png'),
      fullPage: true,
    });

    // Desktop overview
    console.log('11/11 - Capturing desktop overview...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: join(screenshotsDir, '11-desktop-overview.png'),
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
    });

    console.log('✅ All screenshots captured successfully!');
    await context.close();
  } catch (error) {
    console.error('❌ Error taking screenshots:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

takeScreenshots().catch((error) => {
  console.error('Failed to capture screenshots:', error);
  process.exit(1);
});
