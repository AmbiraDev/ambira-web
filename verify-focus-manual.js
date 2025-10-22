const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyFocus() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500  // Slow down actions to see them
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2  // Higher quality screenshots
  });

  const page = await context.newPage();

  const screenshotsDir = path.join(__dirname, 'focus-verification');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  console.log('Navigating to analytics page...');

  try {
    await page.goto('http://localhost:3007/analytics', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for the page to fully load
    await page.waitForTimeout(3000);

    // Take initial screenshot
    console.log('1. Baseline screenshot');
    await page.screenshot({
      path: path.join(screenshotsDir, '01-baseline.png'),
      fullPage: false
    });

    // Focus on Activity Selector
    console.log('2. Focusing Activity Selector button...');
    const activityButton = await page.locator('button[aria-label="Select activity to filter analytics"]').first();
    await activityButton.focus();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, '02-activity-button-focused.png'),
      fullPage: false,
      clip: { x: 0, y: 0, width: 800, height: 400 }
    });

    // Click to open dropdown
    console.log('3. Opening Activity dropdown...');
    await activityButton.click();
    await page.waitForTimeout(1000);

    // Take screenshot of open dropdown
    await page.screenshot({
      path: path.join(screenshotsDir, '03-activity-dropdown-open.png'),
      fullPage: false,
      clip: { x: 0, y: 0, width: 800, height: 500 }
    });

    // Focus first item in dropdown
    console.log('4. Focusing first dropdown item...');
    const firstOption = await page.locator('button[role="option"]').first();
    await firstOption.focus();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, '04-activity-first-item-focused.png'),
      fullPage: false,
      clip: { x: 0, y: 0, width: 800, height: 500 }
    });

    // Close dropdown
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Focus Chart Type button
    console.log('5. Focusing Chart Type button...');
    const chartTypeButton = await page.locator('button[aria-label="Select chart type for analytics visualization"]').first();
    await chartTypeButton.focus();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, '05-chart-type-button-focused.png'),
      fullPage: false,
      clip: { x: 0, y: 0, width: 800, height: 400 }
    });

    // Open chart type dropdown
    console.log('6. Opening Chart Type dropdown...');
    await chartTypeButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, '06-chart-type-dropdown-open.png'),
      fullPage: false,
      clip: { x: 0, y: 0, width: 800, height: 500 }
    });

    // Focus on Bar option
    console.log('7. Focusing Bar option...');
    const barOption = await page.locator('button[aria-label="Display charts as bar charts"]').first();
    await barOption.focus();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, '07-bar-option-focused.png'),
      fullPage: false,
      clip: { x: 0, y: 0, width: 800, height: 500 }
    });

    // Focus on Line option
    console.log('8. Focusing Line option...');
    const lineOption = await page.locator('button[aria-label="Display charts as line charts"]').first();
    await lineOption.focus();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, '08-line-option-focused.png'),
      fullPage: false,
      clip: { x: 0, y: 0, width: 800, height: 500 }
    });

    // Close dropdown
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Focus on time period buttons
    console.log('9. Focusing time period buttons...');
    const timePeriodButtons = await page.locator('button[aria-pressed]');

    for (let i = 0; i < Math.min(3, await timePeriodButtons.count()); i++) {
      await timePeriodButtons.nth(i).focus();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(screenshotsDir, `09-time-period-${i+1}-focused.png`),
        fullPage: false,
        clip: { x: 0, y: 100, width: 1200, height: 400 }
      });
    }

    // Get console messages
    const messages = [];
    page.on('console', msg => {
      messages.push(`${msg.type()}: ${msg.text()}`);
    });

    console.log('\n✅ Verification complete!');
    console.log(`Screenshots saved to: ${screenshotsDir}`);

    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({
      path: path.join(screenshotsDir, 'error.png'),
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

verifyFocus().catch(console.error);
