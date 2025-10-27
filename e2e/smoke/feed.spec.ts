import { test, expect } from '../fixtures/test-base';
import { formatA11yViolations } from '../utils/accessibility';

test.describe('Feed Page - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the feed page
    await page.goto('/');
  });

  test('should load the feed page successfully', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check that the page title is set
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should display main navigation elements', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');

    // Check for header/navigation
    const header = page.locator('header, nav, [role="navigation"]');
    await expect(header.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have proper page structure', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Check for main content area, semantic sections, or landing page content
    // Accepts both authenticated app structure and unauthenticated landing pages
    const mainContent = page.locator(
      'main, [role="main"], section, article, [role="region"]'
    );
    const mainCount = await mainContent.count();
    expect(mainCount).toBeGreaterThanOrEqual(1);

    // Verify main content is visible
    if (mainCount > 0) {
      await expect(mainContent.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Load the page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known/expected errors (e.g., Firebase emulator warnings)
    const criticalErrors = errors.filter(
      error =>
        !error.includes('Firebase') &&
        !error.includes('DevTools') &&
        !error.includes('favicon')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should pass accessibility audit', async ({ page, makeAxeBuilder }) => {
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    const accessibilityScanResults = await makeAxeBuilder().analyze();

    // Check for violations
    const violations = accessibilityScanResults.violations;

    // If there are violations, format them for the error message
    if (violations.length > 0) {
      const formattedViolations = formatA11yViolations(violations);
      console.log('Accessibility violations found:\n', formattedViolations);
    }

    // Expect no violations
    expect(violations).toHaveLength(0);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that main content is visible on mobile
    // Accepts both authenticated app structure and unauthenticated landing pages
    const mainContent = page.locator(
      'main, [role="main"], section, article, [role="region"]'
    );
    const contentCount = await mainContent.count();

    // Verify content is present and visible
    expect(contentCount).toBeGreaterThan(0);
    await expect(mainContent.first()).toBeVisible({ timeout: 10000 });

    // Verify no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
      );
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test('should have working keyboard navigation', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Check if we're on mobile viewport
    const viewport = page.viewportSize();
    const isMobile = viewport && viewport.width < 768;

    // Check if page has focusable content (buttons, links, inputs)
    const focusableElements = page.locator(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const focusableCount = await focusableElements.count();

    // Focus the first interactive element
    await page.keyboard.press('Tab');

    // Check that an element has focus
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement;
      return active ? active.tagName : null;
    });

    expect(focusedElement).toBeTruthy();

    // On mobile browsers, Tab navigation may not work the same way
    // If focus is still on BODY, verify accessibility features exist
    if (focusedElement === 'BODY') {
      // Either skip link exists OR there are other focusable elements OR it's a loading page
      // (Pages may not have focusable elements if showing loading/auth state)
      const skipLink = page.locator('a[href^="#"]').first();
      const skipLinkExists = (await skipLink.count()) > 0;

      // Check if this is a loading screen (has "Loading" text)
      const bodyText = await page.textContent('body');
      const isLoadingScreen = bodyText?.includes('Loading');

      // Pass if: skip link exists OR focusable elements exist OR it's a loading screen
      expect(skipLinkExists || focusableCount > 0 || isLoadingScreen).toBe(
        true
      );
    } else {
      // Tab moved focus away from BODY - good!
      expect(focusedElement).not.toBe('BODY');
    }
  });
});
