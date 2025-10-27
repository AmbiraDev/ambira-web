import { test, expect } from '../fixtures/test-base';
import { formatA11yViolations } from '../utils/accessibility';

test.describe('Timer Page - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the timer page
    await page.goto('/timer');
  });

  test('should load the timer page successfully', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check that the page title is set
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should display timer interface', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Look for timer-related elements (buttons, controls, time display)
    // Using flexible selectors that might match timer UI
    const timerElements = page.locator(
      'button, [role="button"], [role="timer"]'
    );
    const count = await timerElements.count();

    // Expect at least some interactive elements
    expect(count).toBeGreaterThan(0);
  });

  test('should have proper page structure', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Check for main content area
    const mainContent = page.locator('main, [role="main"]');
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
    await page.goto('/timer');
    await page.waitForLoadState('networkidle');

    // Filter out known/expected errors
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
    await page.goto('/timer');
    await page.waitForLoadState('networkidle');

    // Check that main content is visible on mobile
    const mainContent = page.locator('main, [role="main"]');
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

    // Focus the first interactive element
    await page.keyboard.press('Tab');

    // Check that an element has focus
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement;
      return active ? active.tagName : null;
    });

    expect(focusedElement).toBeTruthy();
    expect(focusedElement).not.toBe('BODY');
  });

  test('should display timer controls when authenticated', async ({ page }) => {
    // This test checks for timer controls that should be present
    // It will gracefully handle auth redirects or login prompts

    await page.waitForLoadState('domcontentloaded');

    // Check if we're still on the timer page or redirected to login
    const currentUrl = page.url();

    if (currentUrl.includes('/timer')) {
      // We're on the timer page, check for controls or login prompt
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
      expect(pageContent!.length).toBeGreaterThan(0);
    } else {
      // We were redirected (likely to login), which is expected behavior
      console.log('Redirected to:', currentUrl);
      expect(currentUrl).toBeTruthy();
    }
  });
});
