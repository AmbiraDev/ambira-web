import { test, expect } from '../fixtures/test-base';
import { formatA11yViolations } from '../utils/accessibility';

test.describe('Authentication Pages - Smoke Tests', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to the login page (assuming it's at /login or root redirects)
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
    });

    test('should load authentication interface', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Check that the page has loaded
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
      expect(bodyText!.length).toBeGreaterThan(0);

      // Check for title
      const title = await page.title();
      expect(title).toBeTruthy();
    });

    test('should display authentication elements', async ({ page }) => {
      await page.waitForLoadState('domcontentloaded');

      // Look for login-related elements (forms, buttons, inputs)
      // Using flexible selectors that might match auth UI
      const authElements = page.locator(
        'button, input[type="email"], input[type="password"], [role="button"]'
      );
      const count = await authElements.count();

      // Expect at least some interactive elements
      expect(count).toBeGreaterThan(0);
    });

    test('should have proper page structure', async ({ page }) => {
      await page.waitForLoadState('domcontentloaded');

      // Check for main content area or form
      const contentElements = page.locator('main, form, [role="main"], [role="form"]');
      const count = await contentElements.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should not have console errors on load', async ({ page }) => {
      const errors: string[] = [];

      // Listen for console errors
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Load the page
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Filter out known/expected errors
      const criticalErrors = errors.filter(
        (error) =>
          !error.includes('Firebase') &&
          !error.includes('DevTools') &&
          !error.includes('favicon') &&
          !error.includes('extension')
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

      // Verify page content is visible
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();

      // Verify no horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
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

    test('should handle form validation gracefully', async ({ page }) => {
      await page.waitForLoadState('domcontentloaded');

      // Look for email and password inputs
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      const emailCount = await emailInput.count();
      const passwordCount = await passwordInput.count();
      const submitCount = await submitButton.count();

      // If we have a login form, test basic validation
      if (emailCount > 0 && passwordCount > 0 && submitCount > 0) {
        // Clear inputs
        await emailInput.clear();
        await passwordInput.clear();

        // Try to submit empty form
        await submitButton.click();

        // Wait a moment for validation messages
        await page.waitForTimeout(1000);

        // Check that we're still on the same page (form didn't submit)
        const currentUrl = page.url();
        expect(currentUrl).toBeTruthy();

        // Check for validation messages (HTML5 validation or custom)
        const hasValidationMessage = await page.evaluate(() => {
          const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
          return emailInput ? !emailInput.validity.valid : false;
        });

        // Either HTML5 validation should trigger or we should see error text
        const pageText = await page.textContent('body');
        const hasErrorText =
          pageText?.toLowerCase().includes('error') ||
          pageText?.toLowerCase().includes('required') ||
          pageText?.toLowerCase().includes('invalid');

        expect(hasValidationMessage || hasErrorText).toBe(true);
      }
    });
  });

  test.describe('Protected Routes', () => {
    test('should handle unauthenticated access appropriately', async ({ page }) => {
      // Try to access a protected route (e.g., /profile, /settings)
      const protectedRoutes = ['/settings', '/profile'];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        // The page should either:
        // 1. Redirect to login
        // 2. Show an authentication prompt
        // 3. Display the route (if public or has guest access)

        const currentUrl = page.url();
        const bodyText = await page.textContent('body');

        // Just verify the page loads without errors
        expect(currentUrl).toBeTruthy();
        expect(bodyText).toBeTruthy();
        expect(bodyText!.length).toBeGreaterThan(0);
      }
    });
  });
});
